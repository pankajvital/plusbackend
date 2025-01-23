const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const nodemailer = require("nodemailer");
require("dotenv").config();

const router = express.Router();

// Set up the Nodemailer transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // This disables the certificate chain validation
  },
});

transporter.verify((error, success) => {  
  if (error) {
    console.error("Transporter error:", error);
  } else {
    console.log("Server is ready to send emails:", success);
  }
});
router.post("/adduserdetail", async (req, res) => {
  const { name, email, phone, address, message, selectedProducts } = req.body;

  // Validate input
  if (
    !name ||
    !email ||
    !phone ||
    !address ||
    !message ||
    !selectedProducts ||
    selectedProducts.length === 0
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const formattedProducts = [];

    for (const product of selectedProducts) {
      const foundProduct = await Product.findById(product.product);
      if (!foundProduct) {
        return res
          .status(404)
          .json({ error: `Product with ID ${product.product} not found` });
      }

      const totalVolume = parseFloat(
        foundProduct.volume * product.quantity
      ).toFixed(3);

      formattedProducts.push({
        product: foundProduct._id,
        name: foundProduct.name,
        quantity: product.quantity,
        volume: totalVolume,
      });
    }

    const user = new User({
      name,
      email,
      phone,
      address,
      message,
      selectedProducts: formattedProducts,
    });

    await user.save();

    // Send an email after saving user details
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      bcc: "craftmediahub@gmail.com",
      subject: "Your Order Details",
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #ddd;
          }
          .header h1 {
            color: #4CAF50;
          }
          .content {
            margin-top: 20px;
          }
          .content h2 {
            font-size: 1.2em;
            color: #4CAF50;
          }
          .content p {
            line-height: 1.6;
          }
          .product-list {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .product-list th, .product-list td {
            padding: 10px;
            text-align: left;
          }
          .product-list th {
            background-color: #4CAF50;
            color: white;
          }
          .product-list tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .total {
            font-size: 1.1em;
            font-weight: bold;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            color: #888;
          }
          .footer a {
            color: #4CAF50;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Order, ${name}!</h1>
          </div>
          <div class="content">
            <p>We have received your order and here are the details:</p>
            
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Message:</strong> ${message}</p>
      
            <h2>Selected Products:</h2>
            <table class="product-list">
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Volume (m³)</th>
              </tr>
              ${formattedProducts
                .map(
                  (product) =>
                    `<tr>
                      <td>${product.name}</td>
                      <td>${product.quantity}</td>
                      <td>${product.volume}</td>
                    </tr>`
                )
                .join("")}
            </table>
      
            <div class="total">
              <p><strong>Total Volume:</strong> ${formattedProducts
                .reduce((acc, product) => acc + parseFloat(product.volume), 0)
                .toFixed(3)} m³</p>
            </div>
          </div>
      
          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>For any questions or support, feel free to <a href="mailto:support@deliveryplus.com">contact us</a>.</p>
          </div>
        </div>
      </body>
      </html>`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Error sending email" });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({
          message: "User details saved and email sent successfully",
        });
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/getalluserdetails", async (req, res) => {
  try {
    const users = await User.find().populate("selectedProducts.product");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
