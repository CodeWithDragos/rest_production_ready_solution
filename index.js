require("dotenv").config();
const express = require("express");
const expressWinston = require("express-winston")
const winston = require("winston")
const SwaggerUI = require('swagger-ui')

const connectToDb = require("./database/connectDB")
const ProductModel = require("./database/productModel")
const YAML

const app = express();

// connect to db
connectToDb()

// We need JSON
app.use(express.json())

const loggerOptions = {
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.json(),
      winston.format.prettyPrint()
    )
}
// normal logger
const logger = winston.createLogger(loggerOptions)

// HTTP Logging
app.use(expressWinston.logger(loggerOptions));


app.get("/", (request, response) => {
    response.send("Hello there!")
})

// RESOURCE -- Products
// Get List of product
app.get("/products", async (request, response) => {
    // request to db
    try {
        const filterQuery = request.query;
        let filterParams = {}

        if(filterQuery.name){
            if(filterQuery.name.length > 100){
                // input validation
                return response.status(400).json({
                    message: "The name is too long"
                })
            }else{
                filterParams = {
                    ...filterParams,
                    name: { "$regex": filterQuery.name , "$options": "i" }
                }
            }
        }
        let offset = 0;

        if(filterQuery.page){
            offset = 10 * filterQuery.page
        }

        const productList = await ProductModel.find(filterParams).limit(10).skip(offset)
        response.json(productList)
    } catch (error) {
        logger.error(error)
        response.status(500).json({
            code: "ERR_6778",
            message: "An internal error has occured"
        })
    }

})

// Create a Product
app.post("/products", async(request, response) => {
    const productData = request.body;
    const newProduct = await ProductModel.create(productData)
    response.json(newProduct)
})

// Get product by Id
app.get("/products/:id", async(request, response) => {
    const productId = request.params.id;
    const newProduct = await ProductModel.findById(productId)
    response.json(newProduct)
})

// Delete a product by Id
app.delete("/products/:id", async(request, response) => {
    const productId = request.params.id;
    const deletedProduct = await ProductModel.findOneAndDelete({_id: productId})
    response.json(deletedProduct)
})

// Updated a product by Id
app.patch("/products/:id", async(request, response) => {
    const productId = request.params.id;
    const productUpdate = request.body;
    const newProduct = await ProductModel.findOneAndUpdate({_id: productId}, productUpdate, {new: true})
    response.json(newProduct)
})

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000")
})