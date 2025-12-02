

import firebase from 'firebase/compat/app';
import { db, storage, isFirebaseConfigured } from '../firebaseConfig';
import { Product, UserRole, UserProfile, Order, CartItem, OrderStatus, Review, PaymentMethod, DeliveryMethod, Address, Conversation, ChatMessage, TrackingEvent, Variation, SellerApplication } from '../types';
import { PRODUCTS } from '../constants';

const PRODUCTS_COLLECTION = 'products';
const USERS_COLLECTION = 'users';
const ORDERS_COLLECTION = 'orders';
const REVIEWS_COLLECTION = 'reviews';
const CONVERSATIONS_COLLECTION = 'conversations';
const SELLER_APPLICATIONS_COLLECTION = 'seller_applications';

// Dummy IDs to filter out
const DUMMY_IDS = ['1', '2', '3', '4', '5', '6'];

// Fetch all products from Firestore (excluding dummies)
export const fetchProducts = async (): Promise<Product[]> => {
  if (!isFirebaseConfigured()) return [];

  try {
    const snapshot = await db.collection(PRODUCTS_COLLECTION).get();
    const products: Product[] = [];
    snapshot.forEach((doc) => {
      // Filter out dummy IDs
      if (!DUMMY_IDS.includes(doc.id)) {
        products.push({ id: doc.id, ...doc.data() } as Product);
      }
    });
    return products;
  } catch (error) {
    console.error("Firebase fetch failed", error);
    return [];
  }
};

// Fetch products for a specific seller
export const fetchSellerProducts = async (sellerId: string): Promise<Product[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const snapshot = await db.collection(PRODUCTS_COLLECTION)
      .where('sellerId', '==', sellerId)
      .get();
    
    const products: Product[] = [];
    snapshot.forEach((doc) => {
      if (!DUMMY_IDS.includes(doc.id)) {
        products.push({ id: doc.id, ...doc.data() } as Product);
      }
    });
    return products;
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return [];
  }
};

// Add a new product
export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string | null> => {
  if (!isFirebaseConfigured()) return null;
  try {
    const docRef = await db.collection(PRODUCTS_COLLECTION).add(productData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    return null;
  }
};

// Update a product
export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<boolean> => {
  if (!isFirebaseConfigured()) return false;
  try {
    await db.collection(PRODUCTS_COLLECTION).doc(productId).update(updates);
    return true;
  } catch (error) {
    console.error("Error updating product:", error);
    return false;
  }
};

// Delete a product
export const deleteProduct = async (productId: string): Promise<boolean> => {
  if (!isFirebaseConfigured()) return false;
  try {
    await db.collection(PRODUCTS_COLLECTION).doc(productId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    return false;
  }
};

// --- REVIEWS & RATINGS ---

export const fetchProductReviews = async (productId: string): Promise<Review[]> => {
    if (!isFirebaseConfigured()) return [];
    try {
        // Query without orderBy to avoid index requirements
        const snapshot = await db.collection(REVIEWS_COLLECTION)
            .where('productId', '==', productId)
            .get();
        
        const reviews: Review[] = [];
        snapshot.forEach(doc => {
            reviews.push({ id: doc.id, ...doc.data() } as Review);
        });

        // Client-side sort
        return reviews.sort((a, b) => {
            const timeA = a.createdAt?.toMillis() || 0;
            const timeB = b.createdAt?.toMillis() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error("Error fetching reviews", error);
        return [];
    }
};

export const addProductReview = async (productId: string, userId: string, userName: string, rating: number, comment: string): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        const batch = db.batch();
        
        // 1. Create Review
        const reviewRef = db.collection(REVIEWS_COLLECTION).doc();
        batch.set(reviewRef, {
            productId,
            userId,
            userName,
            rating,
            comment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. Update Product Rating Aggregate
        const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
        const productDoc = await productRef.get();
        
        if (productDoc.exists) {
            const product = productDoc.data() as Product;
            const currentRating = product.rating || 0;
            const currentReviews = product.reviews || 0;
            
            const newReviewsCount = currentReviews + 1;
            const newRating = ((currentRating * currentReviews) + rating) / newReviewsCount;
            
            batch.update(productRef, {
                rating: parseFloat(newRating.toFixed(1)),
                reviews: newReviewsCount
            });
        }

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error adding review:", error);
        return false;
    }
};

// --- USER MANAGEMENT ---

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    if (!isFirebaseConfigured()) return null;
    try {
        const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
        if (doc.exists) {
            return { uid: doc.id, ...doc.data() } as UserProfile;
        }
    } catch (e) {
        console.error("Error fetching user profile", e);
    }
    return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        await db.collection(USERS_COLLECTION).doc(uid).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating user profile:", error);
        return false;
    }
}

export const updateUserStatus = async (uid: string, status: 'active' | 'suspended' | 'banned', suspensionDays?: number): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        const batch = db.batch();
        const userRef = db.collection(USERS_COLLECTION).doc(uid);
        
        const updates: any = {
            status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (status === 'suspended' && suspensionDays) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + suspensionDays);
            updates.suspensionEndDate = firebase.firestore.Timestamp.fromDate(endDate);
        } else if (status === 'active') {
             updates.suspensionEndDate = firebase.firestore.FieldValue.delete();
        }

        batch.update(userRef, updates);

        // Update all products belonging to this user
        const productsSnapshot = await db.collection(PRODUCTS_COLLECTION).where('sellerId', '==', uid).get();
        productsSnapshot.forEach(doc => {
            batch.update(doc.ref, { sellerStatus: status });
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error updating user status:", error);
        return false;
    }
}

export const checkSuspensionExpiry = async (uid: string): Promise<boolean> => {
  if (!isFirebaseConfigured()) return false;
  try {
    const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!doc.exists) return false;
    const data = doc.data() as UserProfile;
    
    if (data.status === 'suspended' && data.suspensionEndDate) {
      const endDate = data.suspensionEndDate.toDate();
      if (new Date() > endDate) {
        // Expired, reactivate
        console.log("Suspension expired, reactivating user:", uid);
        return await updateUserStatus(uid, 'active');
      }
    }
    return false;
  } catch(e) { 
      console.error("Error checking suspension:", e); 
      return false; 
  }
}

// Helper: Resize Image
const resizeImage = (file: File, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = maxWidth / img.width;
                // If image is smaller than max, don't upscale
                const width = scale < 1 ? maxWidth : img.width;
                const height = scale < 1 ? img.height * scale : img.height;

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Compress to JPEG 0.7 quality
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

// Generic Upload with Fallback
const uploadImageWithFallback = async (path: string, file: File, maxWidth: number = 500): Promise<string | null> => {
    if (!isFirebaseConfigured()) return null;

    // 1. Try Storage Upload
    try {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`${path}/${Date.now()}_${file.name}`);
        
        // Add a timeout to fail fast if storage is blocked/slow
        const uploadTask = fileRef.put(file);
        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => {
                uploadTask.cancel();
                reject(new Error("Upload timed out"));
            }, 3000) // 3s timeout
        );

        await Promise.race([uploadTask, timeoutPromise]);
        const downloadURL = await fileRef.getDownloadURL();
        return downloadURL;

    } catch (error: any) {
        console.warn("Storage upload failed or timed out, using fallback compression.", error);
        
        // 2. Fallback: Client-side resize & compression to Base64
        try {
            // Resize to a very small width (e.g., 300px) to keep string size manageable for Firestore
            const base64String = await resizeImage(file, maxWidth);
            return base64String;
        } catch (resizeError) {
             console.error("Resize fallback failed", resizeError);
             return null;
        }
    }
}

// Upload Profile Image
export const uploadProfileImage = async (userId: string, file: File): Promise<string | null> => {
    return uploadImageWithFallback(`profile_images/${userId}`, file, 300);
};

// Upload Shop Image
export const uploadShopImage = async (userId: string, file: File): Promise<string | null> => {
    return uploadImageWithFallback(`shop_images/${userId}`, file, 400);
};

// Upload Product Image
export const uploadProductImage = async (userId: string, file: File): Promise<string | null> => {
    return uploadImageWithFallback(`product_images/${userId}`, file, 600);
};


// --- ADMIN PRIVILEGES ---

export const fetchAllUsers = async (): Promise<UserProfile[]> => {
    if (!isFirebaseConfigured()) return [];
    try {
        const snapshot = await db.collection(USERS_COLLECTION).orderBy('createdAt', 'desc').get();
        const users: UserProfile[] = [];
        snapshot.forEach(doc => {
            users.push({ ...doc.data(), uid: doc.id } as UserProfile);
        });
        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export const updateUserRole = async (uid: string, role: UserRole): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        await db.collection(USERS_COLLECTION).doc(uid).update({ 
            role,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating user role:", error);
        return false;
    }
}

export const deleteUserDocument = async (uid: string): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        await db.collection(USERS_COLLECTION).doc(uid).delete();
        return true;
    } catch (error) {
        console.error("Error deleting user document:", error);
        return false;
    }
}

// --- SELLER APPLICATION ---

export const submitSellerApplication = async (data: SellerApplication): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        await db.collection(SELLER_APPLICATIONS_COLLECTION).add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error submitting application", error);
        return false;
    }
}

export const fetchSellerApplications = async (status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<SellerApplication[]> => {
    if (!isFirebaseConfigured()) return [];
    try {
        const snapshot = await db.collection(SELLER_APPLICATIONS_COLLECTION)
            .where('status', '==', status)
            .get();
        const apps: SellerApplication[] = [];
        snapshot.forEach(doc => {
            apps.push({ id: doc.id, ...doc.data() } as SellerApplication);
        });
        return apps;
    } catch (error) {
        console.error("Error fetching applications", error);
        return [];
    }
}

export const fetchApprovedSellers = async (): Promise<UserProfile[]> => {
    if (!isFirebaseConfigured()) return [];
    try {
        const snapshot = await db.collection(USERS_COLLECTION)
            .where('role', '==', 'seller')
            .get();
        const sellers: UserProfile[] = [];
        snapshot.forEach(doc => {
            sellers.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        return sellers;
    } catch (error) {
        console.error("Error fetching approved sellers:", error);
        return [];
    }
}

export const approveSellerApplication = async (application: SellerApplication): Promise<boolean> => {
    if (!isFirebaseConfigured() || !application.id || !application.userId) return false;
    try {
        const batch = db.batch();

        // 1. Update Application Status
        const appRef = db.collection(SELLER_APPLICATIONS_COLLECTION).doc(application.id);
        batch.update(appRef, { status: 'approved' });

        // 2. Update User Profile
        // Assign the mock username email format as requested
        const cleanBusinessName = application.businessName.toLowerCase().replace(/\s+/g, '');
        const sellerEmail = `${cleanBusinessName}@tataknorte.ph`;

        const userRef = db.collection(USERS_COLLECTION).doc(application.userId);
        batch.update(userRef, {
            role: 'seller',
            shopName: application.businessName,
            shopAddress: `${application.city}, ${application.province}`,
            status: 'active', // Ensure status is active upon approval
            // We store the "Seller Email" as a property, but we don't change the Auth email 
            // to avoid locking the user out of their account without re-verification.
            sellerEmail: sellerEmail 
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error approving application", error);
        return false;
    }
}

export const rejectSellerApplication = async (applicationId: string): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        await db.collection(SELLER_APPLICATIONS_COLLECTION).doc(applicationId).update({ status: 'rejected' });
        return true;
    } catch (error) {
        console.error("Error rejecting application", error);
        return false;
    }
}


// --- BAG MANAGEMENT ---

export const updateUserBag = async (uid: string, bag: CartItem[]): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        await db.collection(USERS_COLLECTION).doc(uid).update({
            bag: bag
        });
        return true;
    } catch (error) {
        console.error("Error updating bag:", error);
        return false;
    }
}

// --- ORDER MANAGEMENT ---

export const createOrder = async (
    userId: string, 
    userName: string, 
    items: CartItem[], 
    totalAmount: number,
    paymentMethod: PaymentMethod,
    deliveryMethod: DeliveryMethod,
    shippingAddress?: Address
): Promise<string | null> => {
    if (!isFirebaseConfigured()) return null;
    try {
        const batch = db.batch();
        
        // 1. Create the Order Document
        const orderRef = db.collection(ORDERS_COLLECTION).doc();
        const sellerIds = Array.from(new Set(items.map(item => item.sellerId).filter(id => id !== undefined))) as string[];

        const orderData = {
            id: orderRef.id,
            customerId: userId,
            customerName: userName,
            items,
            totalAmount,
            status: 'Processing',
            paymentMethod,
            deliveryMethod,
            shippingAddress: shippingAddress || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            sellerIds: sellerIds
        };
        batch.set(orderRef, orderData);

        // 2. Deduct Stock for each item
        for (const item of items) {
            const productRef = db.collection(PRODUCTS_COLLECTION).doc(item.id);
            const productDoc = await productRef.get();
            
            if (productDoc.exists) {
                const productData = productDoc.data() as Product;
                
                // If item has a selected variation
                if (item.selectedVariation && productData.variations) {
                    const updatedVariations = productData.variations.map(v => {
                        if (v.id === item.selectedVariation!.id) {
                            const currentStock = v.stock || 0;
                            const newStock = Math.max(0, currentStock - item.quantity);
                            return { ...v, stock: newStock };
                        }
                        return v;
                    });

                    // Recalculate total product stock
                    const newTotalStock = updatedVariations.reduce((acc, v) => acc + (v.stock || 0), 0);

                    batch.update(productRef, {
                        variations: updatedVariations,
                        stock: newTotalStock
                    });
                } 
                // Fallback for simple products (legacy support, though UI enforces variations now)
                else if (productData.stock !== undefined) {
                    const newStock = Math.max(0, productData.stock - item.quantity);
                    batch.update(productRef, { stock: newStock });
                }
            }
        }

        await batch.commit();
        return orderRef.id;
    } catch (error) {
        console.error("Error creating order:", error);
        return null;
    }
};

export const fetchOrders = async (userRole: UserRole, userId: string): Promise<Order[]> => {
    if (!isFirebaseConfigured()) return [];
    try {
        // We remove orderBy('createdAt') from the query to avoid composite index errors
        // when combined with .where()
        let query: firebase.firestore.Query = db.collection(ORDERS_COLLECTION);

        if (userRole === 'customer') {
            query = query.where('customerId', '==', userId);
        } else if (userRole === 'seller') {
            // Fetch orders where the sellerIds array contains this seller's ID
            query = query.where('sellerIds', 'array-contains', userId);
        }

        const snapshot = await query.get();
        const orders: Order[] = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() } as Order);
        });

        // Sort client-side
        return orders.sort((a, b) => {
             const timeA = a.createdAt?.toMillis() || 0;
             const timeB = b.createdAt?.toMillis() || 0;
             return timeB - timeA;
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        await db.collection(ORDERS_COLLECTION).doc(orderId).update({ status });
        return true;
    } catch (error) {
        console.error("Error updating order status:", error);
        return false;
    }
};

export const requestOrderCancellation = async (orderId: string, reason: string): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        await db.collection(ORDERS_COLLECTION).doc(orderId).update({
            status: 'Cancellation Requested',
            cancellationReason: reason
        });
        return true;
    } catch (error) {
        console.error("Error requesting cancellation:", error);
        return false;
    }
};

export const approveOrderCancellation = async (orderId: string): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        await db.runTransaction(async (transaction) => {
            const orderRef = db.collection(ORDERS_COLLECTION).doc(orderId);
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists) throw new Error("Order does not exist");

            const order = orderDoc.data() as Order;

            if (order.status === 'Cancelled') return; // Already cancelled

            // 1. Identify unique products
            const productIds = Array.from(new Set(order.items.map(item => item.id)));
            
            // 2. Read all needed product docs
            const productDocs = await Promise.all(
                productIds.map(pid => transaction.get(db.collection(PRODUCTS_COLLECTION).doc(pid)))
            );

            // 3. Update Order Status
            transaction.update(orderRef, { status: 'Cancelled' });

            // 4. Calculate and execute Stock Updates
            productDocs.forEach(pDoc => {
                if (!pDoc.exists) return; // Skip deleted products

                const productData = pDoc.data() as Product;
                const productId = pDoc.id;
                
                const itemsToRestore = order.items.filter(item => item.id === productId);
                
                let newVariations = productData.variations ? [...productData.variations] : [];
                let stockRestored = 0;
                let variationsUpdated = false;

                itemsToRestore.forEach(item => {
                    stockRestored += item.quantity;
                    if (item.selectedVariation && newVariations.length > 0) {
                        const varIndex = newVariations.findIndex(v => v.id === item.selectedVariation!.id);
                        if (varIndex !== -1) {
                            newVariations[varIndex] = {
                                ...newVariations[varIndex],
                                stock: (newVariations[varIndex].stock || 0) + item.quantity
                            };
                            variationsUpdated = true;
                        }
                    }
                });

                const updates: any = {};
                if (variationsUpdated) {
                    updates.variations = newVariations;
                    updates.stock = newVariations.reduce((sum, v) => sum + (v.stock || 0), 0);
                } else {
                    updates.stock = (productData.stock || 0) + stockRestored;
                }

                transaction.update(db.collection(PRODUCTS_COLLECTION).doc(productId), updates);
            });
        });
        return true;
    } catch (error) {
        console.error("Error approving cancellation:", error);
        return false;
    }
};

// Helper to generate automated tracking number
const generateTrackingNumber = () => {
    // Generate a 12-digit number starting with '9'
    const random = Math.floor(Math.random() * 100000000000).toString().padStart(11, '0');
    return '9' + random;
};

export const updateOrderTracking = async (orderId: string, courier: string = 'J&T Express'): Promise<string | null> => {
    if (!isFirebaseConfigured()) return null;
    try {
        const trackingNumber = generateTrackingNumber();
        await db.collection(ORDERS_COLLECTION).doc(orderId).update({ 
            trackingNumber,
            courier,
            status: 'Shipped' // Automatically mark as shipped when tracking is added
        });
        return trackingNumber;
    } catch (error) {
        console.error("Error updating tracking info:", error);
        return null;
    }
};

// --- SIMULATED J&T API ---
export const fetchJtTracking = async (trackingNumber: string, currentStatus: OrderStatus): Promise<TrackingEvent[]> => {
    // This simulates an API call to J&T Express
    // In a real app, this would be: await axios.get(`https://api.jtexpress.ph/track/${trackingNumber}`)
    
    return new Promise((resolve) => {
        setTimeout(() => {
            const today = new Date();
            const history: TrackingEvent[] = [];
            
            // Generate mock history based on status
            if (currentStatus === 'Shipped' || currentStatus === 'Delivered') {
                history.push({
                    timestamp: new Date(today.getTime() - 86400000 * 2).toLocaleString(),
                    status: 'Picked Up',
                    location: 'Ilocos Norte Drop-off Point',
                    description: 'Parcel has been received at drop-off point.'
                });
                history.push({
                    timestamp: new Date(today.getTime() - 86400000 * 1.5).toLocaleString(),
                    status: 'Departure',
                    location: 'Laoag Sorting Center',
                    description: 'Parcel has departed from sorting center.'
                });
                history.push({
                    timestamp: new Date(today.getTime() - 86400000 * 0.5).toLocaleString(),
                    status: 'Arrival',
                    location: 'Manila Gateway',
                    description: 'Parcel has arrived at the destination gateway.'
                });
            }

            if (currentStatus === 'Delivered') {
                 history.push({
                    timestamp: new Date(today.getTime() - 3600000 * 4).toLocaleString(),
                    status: 'Out for Delivery',
                    location: 'Pasig City Hub',
                    description: 'Rider is on the way to your location.'
                });
                history.push({
                    timestamp: new Date(today.getTime()).toLocaleString(),
                    status: 'Delivered',
                    location: 'Customer Address',
                    description: 'Parcel has been delivered successfully. Proof of delivery uploaded.'
                });
            }

            // Reverse to show newest first
            resolve(history.reverse());
        }, 1500); // Simulate network delay
    });
};

// --- CHAT SYSTEM ---

export const startConversation = async (
    currentUserId: string, 
    otherUserId: string, 
    currentUserName: string,
    otherUserName: string,
    initialMessage: string
): Promise<string | null> => {
    if (!isFirebaseConfigured()) return null;
    try {
        // Check if a conversation already exists
        // Note: Firestore array-contains only handles one value. 
        // For two participants, complex querying is needed or generating a unique ID from sorted UIDs.
        const sortedIds = [currentUserId, otherUserId].sort().join('_');
        const convoRef = db.collection(CONVERSATIONS_COLLECTION).doc(sortedIds);
        const convoDoc = await convoRef.get();

        const timestamp = firebase.firestore.FieldValue.serverTimestamp();

        if (!convoDoc.exists) {
            await convoRef.set({
                participants: [currentUserId, otherUserId],
                participantNames: {
                    [currentUserId]: currentUserName,
                    [otherUserId]: otherUserName
                },
                lastMessage: initialMessage,
                lastMessageTimestamp: timestamp,
                updatedAt: timestamp
            });
        } else {
            // Update existing conversation
            await convoRef.update({
                lastMessage: initialMessage,
                lastMessageTimestamp: timestamp,
                updatedAt: timestamp
            });
        }

        // Add the message to subcollection
        await convoRef.collection('messages').add({
            senderId: currentUserId,
            text: initialMessage,
            timestamp: timestamp
        });

        return sortedIds;
    } catch (error) {
        console.error("Error starting conversation:", error);
        return null;
    }
};

export const sendMessage = async (conversationId: string, senderId: string, text: string): Promise<boolean> => {
    if (!isFirebaseConfigured()) return false;
    try {
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const convoRef = db.collection(CONVERSATIONS_COLLECTION).doc(conversationId);

        await convoRef.collection('messages').add({
            senderId,
            text,
            timestamp
        });

        await convoRef.update({
            lastMessage: text,
            lastMessageTimestamp: timestamp,
            updatedAt: timestamp
        });

        return true;
    } catch (error) {
        console.error("Error sending message:", error);
        return false;
    }
};

export const getUserConversations = (userId: string, callback: (conversations: Conversation[]) => void) => {
    if (!isFirebaseConfigured()) return () => {};
    
    // Removing orderBy('updatedAt', 'desc') to avoid requiring a composite index.
    // Sorting will be done client-side in the callback.
    return db.collection(CONVERSATIONS_COLLECTION)
        .where('participants', 'array-contains', userId)
        .onSnapshot(snapshot => {
            const conversations: Conversation[] = [];
            snapshot.forEach(doc => {
                conversations.push({ id: doc.id, ...doc.data() } as Conversation);
            });
            
            // Client-side sort
            conversations.sort((a, b) => {
                const timeA = a.updatedAt?.toMillis() || 0;
                const timeB = b.updatedAt?.toMillis() || 0;
                return timeB - timeA;
            });
            
            callback(conversations);
        });
};

export const subscribeToMessages = (conversationId: string, callback: (messages: ChatMessage[]) => void) => {
    if (!isFirebaseConfigured()) return () => {};

    return db.collection(CONVERSATIONS_COLLECTION)
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            const messages: ChatMessage[] = [];
            snapshot.forEach(doc => {
                messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            callback(messages);
        });
};


// Seed the database with initial data if it's empty
export const seedDatabase = async () => {
    // Disabled to prevent dummy data generation
    // console.log("Seeding disabled.");
    return false;
};

export const createUserDocument = async (user: any, additionalData: any = {}) => {
  if (!isFirebaseConfigured()) return;
  if (!user) return;

  const userRef = db.collection(USERS_COLLECTION).doc(user.uid);
  
  try {
    const snapshot = await userRef.get();
    const { email, displayName, photoURL, uid } = user;
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();

    let role: UserRole = 'customer';
    
    if (email) {
        const lowerEmail = email.toLowerCase();
        if (lowerEmail.endsWith('@tataknorte.ph')) {
            if (lowerEmail.startsWith('admin')) {
                role = 'admin';
            } else if (lowerEmail.startsWith('seller')) {
                role = 'seller';
            }
        }
    }

    if (!snapshot.exists) {
      try {
        await userRef.set({
          uid,
          email,
          displayName,
          photoURL,
          createdAt: timestamp,
          lastLoginAt: timestamp,
          role: role,
          status: 'active', // Default status
          bag: [], 
          ...additionalData,
        });
        console.log(`New user account created. Role: ${role}`);
      } catch (error) {
        console.error("Error creating user document", error);
      }
    } else {
        // If user exists, prioritized existing data over auth provider data to prevent overwrites of custom uploads
        const userData = snapshot.data();
        const updates: any = {
             lastLoginAt: timestamp
        };
        
        // Only update display name if it's missing in DB
        if (!userData?.displayName && displayName) {
            updates.displayName = displayName;
        }

        // Only update photoURL if it's missing in DB (Preserve custom uploads)
        if (!userData?.photoURL && photoURL) {
            updates.photoURL = photoURL;
        }

      try {
        await userRef.update(updates);
      } catch (error) {
        console.error("Error updating user document", error);
      }
    }
  } catch (error) {
    console.error("Error accessing Firestore", error);
  }
};