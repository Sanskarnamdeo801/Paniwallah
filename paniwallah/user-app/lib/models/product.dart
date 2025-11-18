class Product {
  final String id;
  final String name;
  final String description;
  final String category;
  final String size;
  final double price;
  final double? discountPrice;
  final String image;
  final int stock;
  final bool isAvailable;
  final List<String> features;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.size,
    required this.price,
    this.discountPrice,
    required this.image,
    required this.stock,
    required this.isAvailable,
    required this.features,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? '',
      size: json['size'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      discountPrice: json['discountPrice']?.toDouble(),
      image: json['image'] ?? '',
      stock: json['stock'] ?? 0,
      isAvailable: json['isAvailable'] ?? true,
      features: List<String>.from(json['features'] ?? []),
    );
  }

  double get finalPrice => discountPrice ?? price;
  
  bool get hasDiscount => discountPrice != null && discountPrice! < price;
  
  int get discountPercentage {
    if (!hasDiscount) return 0;
    return (((price - discountPrice!) / price) * 100).round();
  }
}
