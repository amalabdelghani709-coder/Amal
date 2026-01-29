from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from bson import ObjectId
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="دار البقال API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserBase(BaseModel):
    phone: str
    name: str = ""
    role: str = "customer"  # customer, admin, driver, collector
    address: str = ""
    city: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    points: int = 0
    total_orders: int = 0
    is_active: bool = False  # Requires admin approval for customers
    is_approved: bool = False  # Admin must approve new customers

class UserCreate(BaseModel):
    phone: str
    name: str = ""
    role: str = "customer"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserResponse(UserBase):
    id: str
    created_at: datetime

class ProductBase(BaseModel):
    name: str
    description: str = ""
    price: float
    cost_price: float = 0  # سعر الشراء
    original_price: Optional[float] = None
    category: str
    image: str = ""  # Base64 image
    unit: str = ""  # e.g., "kg", "piece", "pack"
    quantity_per_unit: str = ""  # e.g., "1kg", "6 pieces"
    stock: int = 100
    is_new: bool = False
    is_discount: bool = False
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    original_price: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    unit: Optional[str] = None
    quantity_per_unit: Optional[str] = None
    stock: Optional[int] = None
    is_new: Optional[bool] = None
    is_discount: Optional[bool] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str
    created_at: datetime
    sales_count: int = 0

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    total: float

class OrderBase(BaseModel):
    customer_id: str
    customer_name: str
    customer_phone: str
    items: List[OrderItem]
    subtotal: float
    delivery_fee: float
    points_used: int = 0
    points_discount: float = 0
    total: float
    status: str = "pending"  # pending, confirmed, preparing, collecting, ready, delivering, delivered, cancelled
    delivery_address: str = ""
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    notes: str = ""
    modification_reason: str = ""

class OrderCreate(BaseModel):
    items: List[OrderItem]
    delivery_address: str = ""
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    notes: str = ""
    use_points: bool = False

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    items: Optional[List[OrderItem]] = None
    modification_reason: Optional[str] = None
    subtotal: Optional[float] = None
    total: Optional[float] = None

class OrderResponse(OrderBase):
    id: str
    created_at: datetime
    updated_at: datetime
    points_earned: int = 0

class SettingsBase(BaseModel):
    admin_phone: str = ""
    delivery_fee: float = 10.0
    points_percentage: float = 5.0  # 5% of order value as points
    min_order_for_delivery: float = 0
    whatsapp_number: str = ""
    store_name: str = "دار البقال"
    store_description: str = ""
    banner_images: List[str] = []
    # Interface Settings
    primary_color: str = "#2E7D32"
    secondary_color: str = "#FF9800"
    accent_color: str = "#FFC107"
    background_color: str = "#F5F5F5"
    text_color: str = "#212121"
    theme_mode: str = "light"  # light, dark
    products_display: str = "grid"  # grid, list
    products_columns: int = 2  # 1, 2, 3
    # Sections visibility
    show_new_products: bool = True
    show_discounts: bool = True
    show_categories: bool = True
    show_banner: bool = True
    # Custom texts
    welcome_message: str = "مرحباً بك في دار البقال"
    order_success_message: str = "تم استلام طلبك بنجاح! سنتواصل معك قريباً"
    order_preparing_message: str = "طلبك قيد التحضير"
    order_delivering_message: str = "طلبك في الطريق إليك"
    order_delivered_message: str = "تم توصيل طلبك. شكراً لك!"
    empty_cart_message: str = "سلتك فارغة"
    # Icons customization
    cart_icon: str = "cart"
    search_icon: str = "search"
    home_icon: str = "home"
    profile_icon: str = "person"
    orders_icon: str = "receipt"
    # Login Screen Settings
    login_background_image: str = ""
    login_background_mode: str = "cover"  # cover, contain, stretch
    login_name_placeholder: str = "أدخل اسمك الكامل"
    login_phone_placeholder: str = "أدخل رقم هاتفك"
    login_button_text: str = "دخول"
    login_fields_bg_color: str = "#FFFFFF"
    login_fields_text_color: str = "#212121"
    login_button_color: str = "#2E7D32"
    login_button_text_color: str = "#FFFFFF"
    login_fields_border_radius: int = 12  # 0=square, 12=rounded, 25=pill
    login_button_border_radius: int = 12
    login_error_name_required: str = "الرجاء إدخال اسمك (على الأقل حرفين)"
    login_error_phone_required: str = "الرجاء إدخال رقم الهاتف"
    login_error_phone_invalid: str = "رقم الهاتف غير صحيح"
    login_error_generic: str = "فشل تسجيل الدخول. الرجاء المحاولة مرة أخرى"
    # Logo Settings
    login_logo_image: str = ""  # Custom logo image (base64 or URL)
    login_logo_mode: str = "emoji"  # emoji, image
    login_logo_emoji: str = "🛒"  # Default emoji if no image
    login_logo_size: int = 100  # Logo size in pixels

class SettingsUpdate(BaseModel):
    admin_phone: Optional[str] = None
    delivery_fee: Optional[float] = None
    points_percentage: Optional[float] = None
    min_order_for_delivery: Optional[float] = None
    whatsapp_number: Optional[str] = None
    store_name: Optional[str] = None
    store_description: Optional[str] = None
    banner_images: Optional[List[str]] = None
    # Interface Settings
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    theme_mode: Optional[str] = None
    products_display: Optional[str] = None
    products_columns: Optional[int] = None
    # Sections visibility
    show_new_products: Optional[bool] = None
    show_discounts: Optional[bool] = None
    show_categories: Optional[bool] = None
    show_banner: Optional[bool] = None
    # Custom texts
    welcome_message: Optional[str] = None
    order_success_message: Optional[str] = None
    order_preparing_message: Optional[str] = None
    order_delivering_message: Optional[str] = None
    order_delivered_message: Optional[str] = None
    empty_cart_message: Optional[str] = None
    # Icons customization
    cart_icon: Optional[str] = None
    search_icon: Optional[str] = None
    home_icon: Optional[str] = None
    profile_icon: Optional[str] = None
    orders_icon: Optional[str] = None
    # Login Screen Settings
    login_background_image: Optional[str] = None
    login_background_mode: Optional[str] = None
    login_name_placeholder: Optional[str] = None
    login_phone_placeholder: Optional[str] = None
    login_button_text: Optional[str] = None
    login_fields_bg_color: Optional[str] = None
    login_fields_text_color: Optional[str] = None
    login_button_color: Optional[str] = None
    login_button_text_color: Optional[str] = None
    login_fields_border_radius: Optional[int] = None
    login_button_border_radius: Optional[int] = None
    login_error_name_required: Optional[str] = None
    login_error_phone_required: Optional[str] = None
    login_error_phone_invalid: Optional[str] = None
    login_error_generic: Optional[str] = None
    # Logo Settings
    login_logo_image: Optional[str] = None
    login_logo_mode: Optional[str] = None
    login_logo_emoji: Optional[str] = None
    login_logo_size: Optional[int] = None

class PointsTransaction(BaseModel):
    user_id: str
    order_id: Optional[str] = None
    amount: int
    type: str  # earned, used, gift
    description: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GiftCode(BaseModel):
    code: str
    user_id: str
    amount: int
    is_used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    used_at: Optional[datetime] = None

# ==================== HELPER FUNCTIONS ====================

def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc

async def get_settings():
    """Get or create settings"""
    settings = await db.settings.find_one({})
    if not settings:
        default_settings = SettingsBase().dict()
        default_settings["created_at"] = datetime.utcnow()
        result = await db.settings.insert_one(default_settings)
        settings = await db.settings.find_one({"_id": result.inserted_id})
    return settings

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login")
async def login(
    phone: str = Query(...), 
    name: str = Query(""),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None)
):
    """Login or register with phone number"""
    user = await db.users.find_one({"phone": phone})
    
    if not user:
        # Create new user - requires admin approval
        new_user = UserBase(
            phone=phone, 
            name=name,
            latitude=latitude,
            longitude=longitude,
            is_active=False,  # Not active until approved
            is_approved=False  # Needs admin approval
        ).dict()
        new_user["created_at"] = datetime.utcnow()
        result = await db.users.insert_one(new_user)
        user = await db.users.find_one({"_id": result.inserted_id})
        return {**serialize_doc(user), "is_new_registration": True, "needs_approval": True}
    
    # Existing user - check if approved
    return {**serialize_doc(user), "is_new_registration": False, "needs_approval": not user.get("is_approved", False)}

@api_router.get("/auth/user/{user_id}")
async def get_user(user_id: str):
    """Get user by ID"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
        return serialize_doc(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/auth/user/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate):
    """Update user profile"""
    try:
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="لا توجد بيانات للتحديث")
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return serialize_doc(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== ADMIN USER MANAGEMENT ====================

@api_router.post("/admin/users")
async def create_admin_user(user: UserCreate):
    """Create admin, driver, or collector user"""
    existing = await db.users.find_one({"phone": user.phone})
    if existing:
        # Update role if exists
        await db.users.update_one(
            {"_id": existing["_id"]},
            {"$set": {"role": user.role, "name": user.name, "is_approved": True, "is_active": True}}
        )
        updated = await db.users.find_one({"_id": existing["_id"]})
        return serialize_doc(updated)
    
    new_user = UserBase(phone=user.phone, name=user.name, role=user.role).dict()
    new_user["created_at"] = datetime.utcnow()
    # Admin-created accounts are auto-approved
    new_user["is_approved"] = True
    new_user["is_active"] = True
    result = await db.users.insert_one(new_user)
    created = await db.users.find_one({"_id": result.inserted_id})
    return serialize_doc(created)

@api_router.get("/admin/users")
async def get_all_users(role: str = Query(None), sort_by: str = Query("created_at")):
    """Get all users, optionally filtered by role"""
    query = {}
    if role:
        query["role"] = role
    
    sort_field = sort_by if sort_by != "orders" else "total_orders"
    sort_order = -1 if sort_by in ["total_orders", "orders"] else -1
    
    users = await db.users.find(query).sort(sort_field, sort_order).to_list(1000)
    return [serialize_doc(user) for user in users]

@api_router.put("/admin/users/{user_id}/location")
async def update_user_location(user_id: str, latitude: float = Query(...), longitude: float = Query(...)):
    """Update user location (admin only)"""
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"latitude": latitude, "longitude": longitude}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return serialize_doc(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/admin/users/{user_id}/approve")
async def approve_user(user_id: str):
    """Approve a new customer account (admin only)"""
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_approved": True, "is_active": True}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return serialize_doc(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/admin/users/{user_id}/reject")
async def reject_user(user_id: str):
    """Reject a customer account (admin only)"""
    try:
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
        return {"message": "تم رفض وحذف الحساب"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/admin/users/pending")
async def get_pending_users():
    """Get users pending approval"""
    users = await db.users.find({
        "role": "customer",
        "is_approved": False
    }).sort("created_at", -1).to_list(1000)
    return [serialize_doc(user) for user in users]

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products")
async def get_products(
    category: str = Query(None),
    is_new: bool = Query(None),
    is_discount: bool = Query(None),
    search: str = Query(None),
    active_only: bool = Query(True)
):
    """Get all products with optional filters"""
    query = {}
    if category:
        query["category"] = category
    if is_new is not None:
        query["is_new"] = is_new
    if is_discount is not None:
        query["is_discount"] = is_discount
    if active_only:
        query["is_active"] = True
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    products = await db.products.find(query).sort("created_at", -1).to_list(1000)
    return [serialize_doc(product) for product in products]

@api_router.get("/products/categories")
async def get_categories():
    """Get all product categories"""
    categories = await db.products.distinct("category")
    return categories

@api_router.get("/products/top-selling")
async def get_top_selling(limit: int = Query(20)):
    """Get top selling products this month"""
    # Get start of current month
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Aggregate sales from orders this month
    pipeline = [
        {"$match": {"created_at": {"$gte": start_of_month}, "status": {"$ne": "cancelled"}}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "total_sold": {"$sum": "$items.quantity"},
            "total_revenue": {"$sum": "$items.total"},
            "product_name": {"$first": "$items.product_name"}
        }},
        {"$sort": {"total_sold": -1}},
        {"$limit": limit}
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(limit)
    
    # Batch fetch all products to avoid N+1 query
    product_ids = [ObjectId(item["_id"]) for item in results if item.get("_id")]
    products_cursor = await db.products.find({"_id": {"$in": product_ids}}).to_list(len(product_ids))
    products_map = {str(p["_id"]): p for p in products_cursor}
    
    # Enrich with product details
    enriched = []
    for item in results:
        product = products_map.get(str(item["_id"]))
        if product:
            enriched.append({
                "product": serialize_doc(product),
                "total_sold": item["total_sold"],
                "total_revenue": item["total_revenue"]
            })
    
    return enriched

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product"""
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="المنتج غير موجود")
        return serialize_doc(product)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/products")
async def create_product(product: ProductCreate):
    """Create new product"""
    product_dict = product.dict()
    product_dict["created_at"] = datetime.utcnow()
    product_dict["sales_count"] = 0
    result = await db.products.insert_one(product_dict)
    created = await db.products.find_one({"_id": result.inserted_id})
    return serialize_doc(created)

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product: ProductUpdate):
    """Update product"""
    try:
        update_data = {k: v for k, v in product.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="لا توجد بيانات للتحديث")
        
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="المنتج غير موجود")
        
        updated = await db.products.find_one({"_id": ObjectId(product_id)})
        return serialize_doc(updated)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete product (soft delete)"""
    try:
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"is_active": False}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="المنتج غير موجود")
        return {"message": "تم حذف المنتج بنجاح"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/products/bulk")
async def bulk_create_products(products: List[ProductCreate]):
    """Bulk create products (for catalog import)"""
    created = []
    for product in products:
        product_dict = product.dict()
        product_dict["created_at"] = datetime.utcnow()
        product_dict["sales_count"] = 0
        result = await db.products.insert_one(product_dict)
        doc = await db.products.find_one({"_id": result.inserted_id})
        created.append(serialize_doc(doc))
    return {"created": len(created), "products": created}

# ==================== ORDER ROUTES ====================

@api_router.get("/orders")
async def get_orders(
    customer_id: str = Query(None),
    status: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None)
):
    """Get orders with optional filters"""
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["status"] = status
    if date_from:
        query["created_at"] = {"$gte": datetime.fromisoformat(date_from)}
    if date_to:
        if "created_at" not in query:
            query["created_at"] = {}
        query["created_at"]["$lte"] = datetime.fromisoformat(date_to)
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(1000)
    return [serialize_doc(order) for order in orders]

@api_router.get("/orders/today")
async def get_today_orders():
    """Get today's orders for driver"""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    orders = await db.orders.find({
        "created_at": {"$gte": today, "$lt": tomorrow},
        "status": {"$nin": ["cancelled"]}
    }).sort("created_at", 1).to_list(1000)
    
    return [serialize_doc(order) for order in orders]

@api_router.get("/orders/to-collect")
async def get_orders_to_collect():
    """Get orders that need collection"""
    orders = await db.orders.find({
        "status": {"$in": ["confirmed", "preparing"]}
    }).sort("created_at", 1).to_list(1000)
    
    return [serialize_doc(order) for order in orders]

@api_router.get("/orders/products-tomorrow")
async def get_products_for_tomorrow():
    """Get aggregated products needed for tomorrow's deliveries"""
    tomorrow = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    day_after = tomorrow + timedelta(days=1)
    
    pipeline = [
        {"$match": {"created_at": {"$gte": tomorrow, "$lt": day_after}, "status": {"$ne": "cancelled"}}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "product_name": {"$first": "$items.product_name"},
            "total_quantity": {"$sum": "$items.quantity"}
        }},
        {"$sort": {"product_name": 1}}
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(1000)
    return results

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get single order"""
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="الطلبية غير موجودة")
        return serialize_doc(order)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/orders")
async def create_order(order: OrderCreate, user_id: str = Query(...)):
    """Create new order"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
        
        settings = await get_settings()
        
        # Calculate totals
        subtotal = sum(item.total for item in order.items)
        delivery_fee = settings.get("delivery_fee", 10.0)
        points_discount = 0
        points_used = 0
        
        # Check if user can use points (after 3rd order)
        if order.use_points and user.get("total_orders", 0) >= 3 and user.get("points", 0) > 0:
            # Use points to reduce delivery fee
            max_points = int(delivery_fee * 100)  # 1 point = 0.01 currency
            points_used = min(user.get("points", 0), max_points)
            points_discount = points_used / 100
        
        total = subtotal + delivery_fee - points_discount
        
        # Calculate points earned
        points_percentage = settings.get("points_percentage", 5.0)
        points_earned = int(subtotal * points_percentage / 100)
        
        order_dict = {
            "customer_id": user_id,
            "customer_name": user.get("name", ""),
            "customer_phone": user.get("phone", ""),
            "items": [item.dict() for item in order.items],
            "subtotal": subtotal,
            "delivery_fee": delivery_fee,
            "points_used": points_used,
            "points_discount": points_discount,
            "total": total,
            "status": "pending",
            "delivery_address": order.delivery_address or user.get("address", ""),
            "delivery_latitude": order.delivery_latitude or user.get("latitude"),
            "delivery_longitude": order.delivery_longitude or user.get("longitude"),
            "notes": order.notes,
            "modification_reason": "",
            "points_earned": points_earned,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.orders.insert_one(order_dict)
        
        # Update user points and order count
        new_points = user.get("points", 0) - points_used + points_earned
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {"points": new_points},
                "$inc": {"total_orders": 1}
            }
        )
        
        # Record points transactions
        if points_used > 0:
            await db.points_transactions.insert_one({
                "user_id": user_id,
                "order_id": str(result.inserted_id),
                "amount": -points_used,
                "type": "used",
                "description": "استخدام النقط لخصم التوصيل",
                "created_at": datetime.utcnow()
            })
        
        if points_earned > 0:
            await db.points_transactions.insert_one({
                "user_id": user_id,
                "order_id": str(result.inserted_id),
                "amount": points_earned,
                "type": "earned",
                "description": f"مكافأة الطلبية ({points_percentage}%)",
                "created_at": datetime.utcnow()
            })
        
        # Update product sales count
        for item in order.items:
            try:
                await db.products.update_one(
                    {"_id": ObjectId(item.product_id)},
                    {"$inc": {"sales_count": item.quantity}}
                )
            except:
                pass
        
        created = await db.orders.find_one({"_id": result.inserted_id})
        return serialize_doc(created)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/orders/{order_id}")
async def update_order(order_id: str, order_update: OrderUpdate):
    """Update order status or items"""
    try:
        update_data = {k: v for k, v in order_update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="لا توجد بيانات للتحديث")
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="الطلبية غير موجودة")
        
        updated = await db.orders.find_one({"_id": ObjectId(order_id)})
        return serialize_doc(updated)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/orders/{order_id}/collect")
async def confirm_collection(order_id: str):
    """Confirm order collection"""
    try:
        result = await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": "ready", "updated_at": datetime.utcnow()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="الطلبية غير موجودة")
        
        updated = await db.orders.find_one({"_id": ObjectId(order_id)})
        return serialize_doc(updated)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== POINTS & GIFTS ====================

@api_router.get("/points/{user_id}")
async def get_user_points(user_id: str):
    """Get user points and transactions"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
        
        transactions = await db.points_transactions.find(
            {"user_id": user_id}
        ).sort("created_at", -1).to_list(100)
        
        # Check if user is eligible for gifts (after 3rd order)
        is_eligible = user.get("total_orders", 0) >= 3
        
        return {
            "points": user.get("points", 0),
            "total_orders": user.get("total_orders", 0),
            "is_eligible": is_eligible,
            "transactions": transactions
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/gift/generate")
async def generate_gift_code(user_id: str = Query(...), amount: int = Query(...)):
    """Generate gift QR code for customer (driver only)"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
        
        if user.get("points", 0) < amount:
            raise HTTPException(status_code=400, detail="نقاط غير كافية")
        
        # Generate unique code
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        
        gift = {
            "code": code,
            "user_id": user_id,
            "amount": amount,
            "is_used": False,
            "created_at": datetime.utcnow()
        }
        
        await db.gift_codes.insert_one(gift)
        
        # Deduct points
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"points": -amount}}
        )
        
        # Record transaction
        await db.points_transactions.insert_one({
            "user_id": user_id,
            "amount": -amount,
            "type": "gift",
            "description": f"هدية بكود {code}",
            "created_at": datetime.utcnow()
        })
        
        return {"code": code, "amount": amount}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== SETTINGS ====================

@api_router.get("/settings")
async def get_settings_route():
    """Get app settings"""
    settings = await get_settings()
    return serialize_doc(settings)

@api_router.put("/settings")
async def update_settings(settings_update: SettingsUpdate):
    """Update app settings"""
    update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="لا توجد بيانات للتحديث")
    
    settings = await get_settings()
    await db.settings.update_one(
        {"_id": settings["_id"]},
        {"$set": update_data}
    )
    
    updated = await db.settings.find_one({"_id": settings["_id"]})
    return serialize_doc(updated)

# ==================== STATISTICS ====================

@api_router.get("/statistics")
async def get_statistics():
    """Get dashboard statistics"""
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Total customers
    total_customers = await db.users.count_documents({"role": "customer"})
    
    # Total orders
    total_orders = await db.orders.count_documents({})
    
    # Today's orders
    today_orders = await db.orders.count_documents({
        "created_at": {"$gte": today}
    })
    
    # Monthly revenue
    monthly_pipeline = [
        {"$match": {"created_at": {"$gte": start_of_month}, "status": {"$ne": "cancelled"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    monthly_result = await db.orders.aggregate(monthly_pipeline).to_list(1)
    monthly_revenue = monthly_result[0]["total"] if monthly_result else 0
    
    # Today's revenue
    today_pipeline = [
        {"$match": {"created_at": {"$gte": today}, "status": {"$ne": "cancelled"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    today_result = await db.orders.aggregate(today_pipeline).to_list(1)
    today_revenue = today_result[0]["total"] if today_result else 0
    
    # Pending orders
    pending_orders = await db.orders.count_documents({"status": "pending"})
    
    # Orders by status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_result = await db.orders.aggregate(status_pipeline).to_list(100)
    orders_by_status = {item["_id"]: item["count"] for item in status_result}
    
    return {
        "total_customers": total_customers,
        "total_orders": total_orders,
        "today_orders": today_orders,
        "monthly_revenue": monthly_revenue,
        "today_revenue": today_revenue,
        "pending_orders": pending_orders,
        "orders_by_status": orders_by_status
    }

@api_router.get("/customers/locations")
async def get_customers_locations():
    """Get all customer locations for map"""
    customers = await db.users.find({
        "role": "customer",
        "latitude": {"$exists": True, "$ne": None},
        "longitude": {"$exists": True, "$ne": None}
    }).to_list(1000)
    
    return [serialize_doc(customer) for customer in customers]

# ==================== OUT OF STOCK ====================

@api_router.post("/products/{product_id}/out-of-stock")
async def mark_out_of_stock(product_id: str):
    """Mark product as out of stock and get affected orders"""
    try:
        # Mark product as out of stock
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"stock": 0}}
        )
        
        # Find pending orders with this product
        affected_orders = await db.orders.find({
            "status": {"$in": ["pending", "confirmed", "preparing"]},
            "items.product_id": product_id
        }).to_list(100)
        
        return {
            "affected_orders": [serialize_doc(order) for order in affected_orders]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "مرحباً بك في API دار البقال", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
