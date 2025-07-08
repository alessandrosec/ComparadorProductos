const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Si vas a tener un frontend separado

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors()); // Habilita CORS
app.set('json spaces', 2);

// Conexión a MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://mongodb:27017/product_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected for API');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        // No salir del proceso para que el contenedor siga intentando conectar si MongoDB no está listo aún
        setTimeout(connectDB, 5000); // Reintentar conexión después de 5 segundos
    }
};

// Modelo de Producto (debe ser el mismo que en el scraper)
const ProductSchema = new mongoose.Schema({
    name: String,
    price: String,
    description: String,
    rating: String,
    availability: String,
    origin: String,
    scrapedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', ProductSchema);

// Endpoints

// GET /productos → Lista completa de productos.
app.get('/productos', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /productos/origen/:origen → Productos filtrados por origen.
app.get('/productos/origen/:origen', async (req, res) => {
    try {
        const { origen } = req.params;
        const products = await Product.find({ origin: origen });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /comparar?nombre=XYZ → Comparación entre tiendas por nombre de producto.
app.get('/comparar', async (req, res) => {
    try {
        const { nombre } = req.query;
        if (!nombre) {
            return res.status(400).json({ message: 'El parámetro "nombre" es requerido para la comparación.' });
        }

        // Buscar productos que contengan el nombre en cualquiera de los orígenes
        const products = await Product.find({
            name: { $regex: new RegExp(nombre, 'i') } // Búsqueda insensible a mayúsculas/minúsculas
        });

        if (products.length === 0) {
            return res.status(404).json({ message: `No se encontraron productos con el nombre "${nombre}" para comparar.` });
        }

        // Organizar los productos por origen para la comparación
        const comparison = {};
        products.forEach(p => {
            if (!comparison[p.origin]) {
                comparison[p.origin] = [];
            }
            comparison[p.origin].push(p);
        });

        res.json(comparison);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`API REST escuchando en el puerto ${PORT}`);
    connectDB(); // Conectar a la base de datos cuando la API se inicie
});