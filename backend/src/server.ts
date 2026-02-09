import express from "express"
import cors from "cors"
import productRoutes from "./routes/products"
import rentalRoutes from "./routes/rentals"
import equipmentRoutes from "./routes/equipment"
import authRoutes from "./routes/auth"
import usersRoutes from "./routes/users"
import dashboardRoutes from "./routes/dashboard"
import maintenanceRoutes from "./routes/maintenance"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/maintenance", maintenanceRoutes)

app.use("/api/products", productRoutes)
app.use("/api/equipment", equipmentRoutes)
app.use("/api/rentals", rentalRoutes)

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000")
})
