import Database from "better-sqlite3"
import { readFileSync } from "fs"
import { join } from "path"
import { randomUUID, scryptSync, randomBytes } from "crypto"

function hashPasswordSync(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64) as Buffer
  return `${salt}:${hash.toString("hex")}`
}

const DEFAULT_PASSWORD_HASH = hashPasswordSync("demo123")

const dbPath = join(process.cwd(), "dev.db")
const db = new Database(dbPath)

const schemaSQL = readFileSync(join(__dirname, "schema.sql"), "utf-8")
db.exec(schemaSQL)

function generateId(): string {
  return randomUUID()
}

const categories = [
  { name: "Earthmoving", code: "EARTH" },
  { name: "Mining", code: "MINING" },
  { name: "Lifting", code: "LIFT" },
  { name: "Hauling", code: "HAUL" },
  { name: "Drilling", code: "DRILL" },
  { name: "Concrete", code: "CONCRETE" },
  { name: "Compaction", code: "COMPACT" },
  { name: "Pipeline", code: "PIPE" },
  { name: "Oilfield", code: "OILFIELD" },
  { name: "Power", code: "POWER" },
  { name: "Plant", code: "PLANT" },
  { name: "Rail", code: "RAIL" },
  { name: "Tunneling", code: "TUNNEL" },
  { name: "Safety", code: "SAFETY" },
  { name: "Site Support", code: "SUPPORT" },
]

const locations = [
  { name: "Fort McMurray Yard", code: "YMM-YARD", region: "Alberta" },
  { name: "Cold Lake Operations", code: "CL-OPS", region: "Alberta" },
  { name: "Grande Prairie Field Base", code: "GP-FIELD", region: "Alberta" },
  { name: "Edmonton Maintenance Hub", code: "YEG-MAINT", region: "Alberta" },
  { name: "Red Deer Logistics Yard", code: "RD-LOG", region: "Alberta" },
  { name: "Saskatoon Project Staging", code: "YXE-STAGE", region: "Saskatchewan" },
  { name: "Northern Mine Site A", code: "MINE-A", region: "Northern Region" },
  { name: "Northern Mine Site B", code: "MINE-B", region: "Northern Region" },
  { name: "Refinery Turnaround Site", code: "REF-TAR", region: "Industrial Corridor" },
  { name: "Nuclear Plant Contractor Yard", code: "NUC-YARD", region: "Power Sector" },
]

const equipmentCatalog: [string, string][] = [
  ["Hydraulic Excavator", "EARTH"], ["Large Mining Excavator", "MINING"], ["Electric Rope Shovel", "MINING"],
  ["Dragline Excavator", "MINING"], ["Wheel Loader", "EARTH"], ["Large Wheel Loader", "MINING"],
  ["Track Loader", "EARTH"], ["Skid Steer Loader", "EARTH"], ["Compact Track Loader", "EARTH"],
  ["Motor Grader", "EARTH"], ["Articulated Dump Truck", "HAUL"], ["Rigid Frame Haul Truck", "MINING"],
  ["Off-Highway Dump Truck", "HAUL"], ["Underground Mining Truck", "MINING"], ["Water Truck", "SUPPORT"],
  ["Fuel Service Truck", "SUPPORT"], ["Lube Service Truck", "SUPPORT"], ["Boom Truck", "LIFT"],
  ["Rough Terrain Crane", "LIFT"], ["All Terrain Crane", "LIFT"], ["Crawler Crane", "LIFT"],
  ["Tower Crane", "LIFT"], ["Mobile Crane", "LIFT"], ["Telehandler", "LIFT"],
  ["Reach Forklift", "LIFT"], ["Heavy Lift Forklift", "LIFT"], ["Container Handler", "LIFT"],
  ["Side Loader Forklift", "LIFT"], ["Pipe Layer", "PIPE"], ["Bulldozer", "EARTH"],
  ["High Horsepower Dozer", "MINING"], ["Crawler Tractor", "EARTH"], ["Wheel Dozer", "EARTH"],
  ["Soil Compactor", "COMPACT"], ["Padfoot Compactor", "COMPACT"], ["Vibratory Smooth Drum Roller", "COMPACT"],
  ["Tandem Asphalt Roller", "COMPACT"], ["Pneumatic Tire Roller", "COMPACT"], ["Asphalt Paver", "EARTH"],
  ["Cold Planer", "EARTH"], ["Soil Stabilizer", "EARTH"], ["Trench Cutter", "PIPE"],
  ["Chain Trencher", "PIPE"], ["Wheel Trencher", "PIPE"], ["Rock Saw Trencher", "PIPE"],
  ["Horizontal Directional Drill", "DRILL"], ["Large Rotary Drill Rig", "DRILL"], ["Blast Hole Drill Rig", "MINING"],
  ["Surface Mining Drill", "MINING"], ["Core Drill Rig", "DRILL"], ["Diamond Core Drill", "DRILL"],
  ["Reverse Circulation Drill", "DRILL"], ["Auger Drill Rig", "DRILL"], ["Pile Driver", "EARTH"],
  ["Hydraulic Pile Hammer", "EARTH"], ["Vibro Hammer", "EARTH"], ["Drilling Jumbo", "MINING"],
  ["Bolting Jumbo", "MINING"], ["Underground Loader", "MINING"], ["Underground Scooptram", "MINING"],
  ["Underground Personnel Carrier", "MINING"], ["Underground Shotcrete Sprayer", "MINING"],
  ["Underground Scaler", "MINING"], ["Underground Utility Vehicle", "MINING"], ["Mine Service Truck", "MINING"],
  ["Explosives Charging Unit", "MINING"], ["Shotcrete Pump", "CONCRETE"], ["Concrete Boom Pump", "CONCRETE"],
  ["Line Concrete Pump", "CONCRETE"], ["Concrete Mixer Truck", "CONCRETE"], ["Volumetric Concrete Mixer", "CONCRETE"],
  ["Batch Plant", "CONCRETE"], ["Mobile Concrete Batch Plant", "CONCRETE"], ["Cement Bulk Trailer", "CONCRETE"],
  ["Grout Pump", "CONCRETE"], ["Grout Mixing Plant", "CONCRETE"], ["Slurry Pump Unit", "PLANT"],
  ["Dewatering Pump Skid", "PLANT"], ["High Capacity Water Pump", "PLANT"], ["Diesel Generator 500kW", "POWER"],
  ["Diesel Generator 1MW", "POWER"], ["Gas Turbine Generator", "POWER"], ["Portable Power Generator", "POWER"],
  ["Mobile Substation", "POWER"], ["Transformer Skid", "POWER"], ["Electrical Switchgear Container", "POWER"],
  ["Cable Reel Trailer", "POWER"], ["Cable Pulling Winch", "POWER"], ["Pipe Welding Rig", "PIPE"],
  ["Automatic Welding System", "PIPE"], ["Pipe Bending Machine", "PIPE"], ["Pipe Threading Machine", "PIPE"],
  ["Pipe Handling Crane", "PIPE"], ["Pipe Transport Trailer", "PIPE"], ["Pipe Coating Machine", "PIPE"],
  ["Hydrostatic Pressure Test Pump", "PIPE"], ["Sandblasting Unit", "PLANT"], ["Industrial Pressure Washer", "PLANT"],
  ["Hydro Excavation Truck", "SUPPORT"], ["Vacuum Truck", "SUPPORT"], ["Combination Sewer Truck", "SUPPORT"],
  ["Industrial Vacuum Excavator", "SUPPORT"], ["Sludge Removal Truck", "SUPPORT"], ["Tank Cleaning Unit", "PLANT"],
  ["Mobile Flare System", "OILFIELD"], ["Gas Compression Unit", "OILFIELD"], ["Gas Dehydration Unit", "OILFIELD"],
  ["Pumpjack", "OILFIELD"], ["Well Service Rig", "OILFIELD"], ["Coil Tubing Unit", "OILFIELD"],
  ["Wireline Unit", "OILFIELD"], ["Workover Rig", "OILFIELD"], ["Fracturing Pump Truck", "OILFIELD"],
  ["Fracturing Blender", "OILFIELD"], ["Sand Storage System", "OILFIELD"], ["Sand Conveyor System", "OILFIELD"],
  ["Fluid Storage Tank", "OILFIELD"], ["Mud Pump", "OILFIELD"], ["Drilling Mud System", "OILFIELD"],
  ["Drill Pipe Handler", "OILFIELD"], ["Pipe Rack System", "OILFIELD"], ["Top Drive Drilling System", "OILFIELD"],
  ["BOP Handling System", "OILFIELD"], ["Wind Turbine Installation Crane", "POWER"],
  ["Wind Turbine Blade Transporter", "POWER"], ["Wind Turbine Tower Transporter", "POWER"],
  ["Transformer Transport Trailer", "POWER"], ["Self-Propelled Modular Transporter", "HAUL"],
  ["Heavy Haul Tractor", "HAUL"], ["Multi-Axle Lowboy Trailer", "HAUL"], ["Hydraulic Platform Trailer", "HAUL"],
  ["Industrial Material Handler", "PLANT"], ["Scrap Handler Excavator", "PLANT"], ["Log Loader", "HAUL"],
  ["Rail Mounted Crane", "RAIL"], ["Rail Maintenance Grinder", "RAIL"], ["Ballast Regulator", "RAIL"],
  ["Rail Tamper", "RAIL"], ["Rail Track Excavator", "RAIL"], ["Tunnel Boring Machine", "TUNNEL"],
  ["Micro Tunnel Boring Machine", "TUNNEL"], ["Roadheader", "TUNNEL"], ["Shaft Sinking Rig", "TUNNEL"],
  ["Raise Boring Machine", "TUNNEL"], ["Slurry Shield TBM", "TUNNEL"], ["LNG Pump Skid", "PLANT"],
  ["Cryogenic Storage Tank", "PLANT"], ["Industrial Cooling Tower", "PLANT"], ["Industrial Air Compressor", "PLANT"],
  ["High Pressure Air Compressor", "PLANT"], ["Nitrogen Pumping Unit", "PLANT"], ["Oxygen Generation System", "PLANT"],
  ["Industrial Chiller", "PLANT"], ["Heat Exchanger Skid", "PLANT"], ["Chemical Injection Skid", "PLANT"],
  ["Catalyst Handling System", "PLANT"], ["Reactor Vessel Transporter", "PLANT"], ["Industrial Furnace", "PLANT"],
  ["Coke Drum Cutting System", "PLANT"], ["Slag Handling Machine", "PLANT"], ["Steel Mill Ladle Crane", "PLANT"],
  ["Continuous Casting Machine", "PLANT"], ["Rolling Mill Stand", "PLANT"], ["Billet Handling Crane", "PLANT"],
  ["Nuclear Fuel Handling Machine", "POWER"], ["Reactor Vessel Crane", "POWER"],
  ["Spent Fuel Cask Transporter", "POWER"], ["Radiation Shielded Transport Vehicle", "POWER"],
  ["Reactor Coolant Pump", "POWER"], ["Turbine Generator Set", "POWER"], ["Cooling Water Pump Station", "POWER"],
  ["High Voltage Circuit Breaker Unit", "POWER"], ["Grid Power Transformer", "POWER"],
  ["Cable Laying Machine", "POWER"], ["High Mast Lighting Tower", "SUPPORT"], ["Mobile Lighting Plant", "SUPPORT"],
  ["Industrial Fire Truck", "SAFETY"], ["Industrial Foam Suppression Unit", "SAFETY"],
  ["Hazmat Response Vehicle", "SAFETY"], ["Confined Space Rescue Unit", "SAFETY"],
  ["Site Ambulance Unit", "SAFETY"], ["Mobile Command Center", "SAFETY"],
  ["Remote Inspection Drone System", "SAFETY"], ["Industrial Survey Drone System", "SAFETY"],
]

const manufacturers = [
  "Caterpillar", "Komatsu", "Liebherr", "Hitachi", "Volvo", "John Deere", "Sandvik", "Epiroc",
  "Terex", "Sany", "XCMG", "Manitowoc", "Kalmar", "Atlas Copco", "National Oilwell Varco",
  "Schramm", "Boart Longyear", "Putzmeister", "Zoomlion", "Mammoet",
]

const departments = ["Operations", "Field Services", "Maintenance", "Turnaround", "Projects", "Logistics"]
const jobSites = [
  "North Pit Expansion", "Steam Plant Upgrade", "Tailings Cell 4", "Pipeline Spread 7",
  "Refinery Turnaround Unit 12", "Cooling Water Upgrade", "Crusher Relocation",
  "Substation Expansion", "Well Pad 14B", "Tank Farm Rehabilitation",
]

const noteBodies = [
  "Operator reported intermittent hydraulic pressure drop.",
  "Routine inspection completed with no major concerns.",
  "Unit should be prioritized for next service window.",
  "Observed minor wear on track assembly.",
  "Awaiting parts before maintenance can proceed.",
  "Equipment returned in acceptable condition.",
  "Temporary restriction applied pending maintenance review.",
  "Technician recommends follow-up inspection in 14 days.",
]

const issueTitles = [
  "Hydraulic leak detected", "Excessive vibration during operation", "Electrical fault warning",
  "Brake response inconsistent", "Track wear above acceptable threshold", "Boom control lag reported",
  "Engine overheating under load", "Cab display intermittently failing",
]

const EQUIPMENT_STATUSES = ["AVAILABLE", "RESERVED", "CHECKED_OUT", "OVERDUE", "DUE_SOON_MAINTENANCE", "IN_MAINTENANCE", "OUT_OF_SERVICE"] as const
const RENTAL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "RESERVED", "CHECKED_OUT", "RETURNED", "OVERDUE", "CANCELLED"] as const
const ISSUE_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const
const ISSUE_STATUS_VALUES = ["OPEN", "REVIEWED", "IN_PROGRESS", "RESOLVED"] as const
const MAINTENANCE_TRIGGERS = ["ROUTINE", "ISSUE_REPORTED", "INSPECTION", "BREAKDOWN", "ADMIN_REQUEST"] as const
const MAINTENANCE_STATUS_VALUES = ["OPEN", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] as const
const NOTE_TARGET_TYPES = ["EQUIPMENT_UNIT", "RENTAL", "MAINTENANCE_RECORD", "ISSUE_REPORT"] as const

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDateWithinPast(daysBack: number) {
  const d = new Date()
  d.setDate(d.getDate() - randomInt(0, daysBack))
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function slugCode(name: string) {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 6)
}

function uniqueWithCounter(base: string, used: Set<string>) {
  let next = base
  let counter = 2
  while (used.has(next)) {
    next = `${base}-${counter}`
    counter++
  }
  used.add(next)
  return next
}

function main() {
  const runSeed = db.transaction(() => {
    db.exec("DELETE FROM AuditLog")
    db.exec("DELETE FROM Note")
    db.exec("DELETE FROM IssueReport")
    db.exec("DELETE FROM MaintenanceRecord")
    db.exec("DELETE FROM Rental")
    db.exec("DELETE FROM EquipmentUnit")
    db.exec("DELETE FROM EquipmentType")
    db.exec("DELETE FROM EquipmentCategory")
    db.exec("DELETE FROM Location")
    db.exec("DELETE FROM User")

    const insertCategory = db.prepare("INSERT INTO EquipmentCategory (id, name, code) VALUES (?, ?, ?)")
    const insertLocation = db.prepare("INSERT INTO Location (id, name, code, region) VALUES (?, ?, ?, ?)")
    const insertUser = db.prepare("INSERT INTO User (id, name, email, passwordHash, role, department, phoneNumber, position, isAvatarIcon, avatarUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    const insertType = db.prepare("INSERT INTO EquipmentType (id, name, code, manufacturer, model, categoryId, description, defaultMaintenanceDays, defaultRentalWarningDays, requiresApproval, highRisk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    const insertUnit = db.prepare("INSERT INTO EquipmentUnit (id, assetTag, serialNumber, equipmentTypeId, locationId, status, year, inServiceDate, lastMaintenanceAt, nextMaintenanceDue, notesSummary, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)")
    const insertRental = db.prepare("INSERT INTO Rental (id, equipmentUnitId, equipmentTypeId, requesterId, approverId, checkedOutById, returnedById, locationId, status, reason, jobSite, requestedStart, requestedEnd, approvedStart, approvedEnd, checkedOutAt, returnedAt, rejectedReason, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    const insertAuditLog = db.prepare("INSERT INTO AuditLog (id, action, actorId, rentalId, equipmentUnitId, maintenanceRecordId, issueReportId, message, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    const insertIssue = db.prepare("INSERT INTO IssueReport (id, equipmentUnitId, reportedById, title, description, severity, status, reportedAt, resolvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    const insertMaintenance = db.prepare("INSERT INTO MaintenanceRecord (id, equipmentUnitId, technicianId, status, trigger, issueReportId, title, description, scheduledFor, startedAt, completedAt, nextDueAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    const insertNote = db.prepare("INSERT INTO Note (id, authorId, body, targetType, equipmentUnitId, rentalId, maintenanceRecordId, issueReportId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")

    const createdCategories = new Map<string, string>()
    for (const category of categories) {
      const id = generateId()
      insertCategory.run(id, category.name, category.code)
      createdCategories.set(category.code, id)
    }

    const createdLocations: { id: string }[] = []
    for (const location of locations) {
      const id = generateId()
      insertLocation.run(id, location.name, location.code, location.region)
      createdLocations.push({ id })
    }

    const users: { id: string; role: string; name: string }[] = []

    const adminProfiles = [
      { name: "Administrator", position: "Operations Director" },
      { name: "Sarah Jenkins", position: "Fleet Manager" },
      { name: "David Chen", position: "Site Superintendent" },
      { name: "Amanda Torres", position: "Logistics Coordinator" },
      { name: "Michael O'Connor", position: "HSE Manager" },
      { name: "Lisa Wong", position: "Equipment Dispatcher" },
    ]

    for (let i = 0; i < adminProfiles.length; i++) {
      const id = generateId()
      insertUser.run(id, adminProfiles[i].name, `admin${i + 1}@equiptrack.local`, DEFAULT_PASSWORD_HASH, "ADMIN",
        "Administration", `555-010${i}`, adminProfiles[i].position, 1,
        randomItem(["hardhat", "wrench", "truck", "clipboard", "gear"]))
      users.push({ id, role: "ADMIN", name: adminProfiles[i].name })
    }

    const fieldWorkerNames = [
      "James Smith", "Maria Garcia", "John Johnson", "Robert Williams",
      "Michael Brown", "William Jones", "David Miller", "Richard Davis",
      "Joseph Garcia", "Thomas Rodriguez", "Charles Wilson", "Christopher Martinez",
      "Daniel Anderson", "Matthew Taylor", "Anthony Thomas", "Mark Hernandez",
      "Donald Moore", "Steven Martin",
    ]

    for (let i = 0; i < fieldWorkerNames.length; i++) {
      const id = generateId()
      insertUser.run(id, fieldWorkerNames[i], `field${i + 1}@equiptrack.local`, DEFAULT_PASSWORD_HASH, "FIELD_WORKER",
        randomItem(departments), `555-020${String(i).padStart(2, "0")}`,
        randomItem(["Heavy Equipment Operator", "Site Supervisor", "Foreman", "Laborer", "Surveyor"]),
        1, randomItem(["hardhat", "truck", "clipboard"]))
      users.push({ id, role: "FIELD_WORKER", name: fieldWorkerNames[i] })
    }

    const maintenanceNames = [
      "Paul Lee", "Kevin Perez", "Brian Thompson", "George White",
      "Edward Harris", "Ronald Sanchez", "Timothy Clark", "Jason Ramirez",
      "Jeffrey Lewis", "Ryan Robinson", "Jacob Walker", "Gary Young",
    ]

    for (let i = 0; i < maintenanceNames.length; i++) {
      const id = generateId()
      insertUser.run(id, maintenanceNames[i], `maintenance${i + 1}@equiptrack.local`, DEFAULT_PASSWORD_HASH, "MAINTENANCE",
        "Maintenance", `555-030${String(i).padStart(2, "0")}`,
        randomItem(["Heavy Duty Mechanic", "Welder", "Electrical Technician", "Service Truck Operator", "Shop Foreman"]),
        1, randomItem(["wrench", "gear", "hardhat"]))
      users.push({ id, role: "MAINTENANCE", name: maintenanceNames[i] })
    }

    const admins = users.filter((u) => u.role === "ADMIN")
    const fieldWorkers = users.filter((u) => u.role === "FIELD_WORKER")
    const maintenanceUsers = users.filter((u) => u.role === "MAINTENANCE")

    const createdTypes: { id: string; code: string; defaultMaintenanceDays: number }[] = []
    const usedTypeCodes = new Set<string>()

    for (const [name, categoryCode] of equipmentCatalog) {
      const manufacturer = randomItem(manufacturers)
      const model = `${slugCode(name)}-${randomInt(100, 999)}`
      const defaultMaintenanceDays = randomItem([30, 45, 60, 90, 120, 180])
      const requiresApproval = Math.random() < 0.45 ? 1 : 0
      const highRisk = Math.random() < 0.2 ? 1 : 0
      const typeCode = uniqueWithCounter(`${slugCode(name)}-${randomInt(10, 99)}`, usedTypeCodes)
      const id = generateId()

      insertType.run(id, name, typeCode, manufacturer, model,
        createdCategories.get(categoryCode)!, `${name} used for industrial and heavy civil operations.`,
        defaultMaintenanceDays, randomItem([3, 5, 7, 10, 14]), requiresApproval, highRisk)

      createdTypes.push({ id, code: typeCode, defaultMaintenanceDays })
    }

    const allUnits: { id: string; assetTag: string; equipmentTypeId: string }[] = []
    const usedAssetTags = new Set<string>()
    const usedSerialNumbers = new Set<string>()

    for (const equipmentType of createdTypes) {
      const unitCount = randomInt(3, 8)
      const typeCodeClean = equipmentType.code.replace(/[^A-Z0-9-]/g, "").slice(0, 8)

      for (let i = 1; i <= unitCount; i++) {
        const location = randomItem(createdLocations)
        const lastMaintenanceAt = randomDateWithinPast(180)
        const nextMaintenanceDue = addDays(lastMaintenanceAt, equipmentType.defaultMaintenanceDays ?? 90)

        let status = "AVAILABLE"
        const roll = Math.random()
        if (roll < 0.65) status = "AVAILABLE"
        else if (roll < 0.73) status = "RESERVED"
        else if (roll < 0.83) status = "CHECKED_OUT"
        else if (roll < 0.88) status = "DUE_SOON_MAINTENANCE"
        else if (roll < 0.95) status = "IN_MAINTENANCE"
        else status = "OUT_OF_SERVICE"

        const assetTag = uniqueWithCounter(`${typeCodeClean}-${String(i).padStart(3, "0")}`, usedAssetTags)
        const serialNumber = uniqueWithCounter(`SN-${typeCodeClean}-${randomInt(100000, 999999)}`, usedSerialNumbers)
        const id = generateId()

        insertUnit.run(id, assetTag, serialNumber, equipmentType.id, location.id,
          status, randomInt(2012, 2026), randomDateWithinPast(1800).toISOString(),
          lastMaintenanceAt.toISOString(), nextMaintenanceDue.toISOString(),
          Math.random() < 0.25 ? "Monitor for upcoming service interval." : null)

        allUnits.push({ id, assetTag, equipmentTypeId: equipmentType.id })
      }
    }

    const createdRentals: { id: string }[] = []
    for (let i = 0; i < 260; i++) {
      const unit = randomItem(allUnits)
      const requester = randomItem(fieldWorkers)
      const approver = Math.random() < 0.8 ? randomItem(admins) : null
      const location = randomItem(createdLocations)

      const requestedStart = randomDateWithinPast(60)
      const requestedEnd = addDays(requestedStart, randomInt(2, 21))

      let status = "PENDING"
      const roll = Math.random()
      if (roll < 0.15) status = "PENDING"
      else if (roll < 0.22) status = "REJECTED"
      else if (roll < 0.36) status = "APPROVED"
      else if (roll < 0.48) status = "RESERVED"
      else if (roll < 0.72) status = "CHECKED_OUT"
      else if (roll < 0.92) status = "RETURNED"
      else status = "OVERDUE"

      const checkedOutBy = (status === "CHECKED_OUT" || status === "RETURNED" || status === "OVERDUE")
        ? randomItem(admins) : null
      const returnedBy = status === "RETURNED" ? randomItem(admins) : null

      const rentalId = generateId()
      const now = new Date().toISOString()

      insertRental.run(rentalId, unit.id, unit.equipmentTypeId, requester.id,
        approver?.id ?? null, checkedOutBy?.id ?? null, returnedBy?.id ?? null, location.id,
        status, `Required for ${randomItem(jobSites)} support operations.`, randomItem(jobSites),
        requestedStart.toISOString(), requestedEnd.toISOString(),
        approver ? requestedStart.toISOString() : null,
        approver ? requestedEnd.toISOString() : null,
        (status === "CHECKED_OUT" || status === "RETURNED" || status === "OVERDUE") ? requestedStart.toISOString() : null,
        status === "RETURNED" ? requestedEnd.toISOString() : null,
        status === "REJECTED" ? "Conflicts with existing booking window." : null,
        now, now)

      createdRentals.push({ id: rentalId })

      insertAuditLog.run(generateId(), "REQUEST_SUBMITTED", requester.id, rentalId, unit.id,
        null, null, `Rental request submitted for ${unit.assetTag}.`, now)

      if (approver) {
        insertAuditLog.run(generateId(),
          status === "REJECTED" ? "REQUEST_REJECTED" : "REQUEST_APPROVED",
          approver.id, rentalId, unit.id, null, null,
          `Rental ${status.toLowerCase()} by admin.`, now)
      }
    }

    const createdIssues: { id: string }[] = []
    for (let i = 0; i < 180; i++) {
      const unit = randomItem(allUnits)
      const reporter = randomItem(fieldWorkers)
      const severity = randomItem(ISSUE_SEVERITIES)
      const status = randomItem(ISSUE_STATUS_VALUES)
      const issueId = generateId()
      const reportedAt = randomDateWithinPast(120)

      insertIssue.run(issueId, unit.id, reporter.id, randomItem(issueTitles),
        "Reported from field operations. Requires inspection and disposition.",
        severity, status, reportedAt.toISOString(),
        status === "RESOLVED" ? randomDateWithinPast(30).toISOString() : null)

      createdIssues.push({ id: issueId })

      insertAuditLog.run(generateId(), "ISSUE_REPORTED", reporter.id, null, unit.id,
        null, issueId, `Issue reported against ${unit.assetTag}.`, new Date().toISOString())
    }

    for (let i = 0; i < 320; i++) {
      const unit = randomItem(allUnits)
      const tech = Math.random() < 0.85 ? randomItem(maintenanceUsers) : null
      const createdAt = randomDateWithinPast(180)
      const trigger = randomItem(MAINTENANCE_TRIGGERS)

      let issueReportId: string | null = null
      if (trigger === "ISSUE_REPORTED" && createdIssues.length > 0) {
        issueReportId = randomItem(createdIssues).id
      }

      const status = randomItem(MAINTENANCE_STATUS_VALUES)
      const startedAt = (status === "IN_PROGRESS" || status === "COMPLETED")
        ? addDays(createdAt, randomInt(0, 5)) : null
      const completedAt = (status === "COMPLETED" && startedAt)
        ? addDays(startedAt, randomInt(1, 10)) : null

      const recordId = generateId()
      const now = new Date().toISOString()

      insertMaintenance.run(recordId, unit.id, tech?.id ?? null, status, trigger,
        issueReportId, `${trigger.replace("_", " ")} maintenance`,
        "Inspection, servicing, and corrective work as required.",
        addDays(createdAt, randomInt(1, 14)).toISOString(),
        startedAt?.toISOString() ?? null, completedAt?.toISOString() ?? null,
        completedAt ? addDays(completedAt, randomItem([30, 60, 90, 120])).toISOString() : null,
        createdAt.toISOString(), now)

      insertAuditLog.run(generateId(),
        status === "COMPLETED" ? "MAINTENANCE_COMPLETED" : "MAINTENANCE_OPENED",
        tech?.id ?? null, null, unit.id, recordId, null,
        `Maintenance record ${status.toLowerCase()} for equipment unit.`, now)
    }

    const sampleRentals = createdRentals.slice(0, 100)
    const sampleIssues = createdIssues.slice(0, 100)

    for (let i = 0; i < 300; i++) {
      const author = randomItem(users)
      const targetPick = randomInt(1, 4)
      const now = new Date().toISOString()

      if (targetPick === 1) {
        const unit = randomItem(allUnits)
        insertNote.run(generateId(), author.id, randomItem(noteBodies), "EQUIPMENT_UNIT",
          unit.id, null, null, null, now)
      } else if (targetPick === 2 && sampleRentals.length) {
        const rental = randomItem(sampleRentals)
        insertNote.run(generateId(), author.id, randomItem(noteBodies), "RENTAL",
          null, rental.id, null, null, now)
      } else if (targetPick === 3) {
        // Skip maintenance record notes for simplicity - no easy lookup without IDs stored
        const unit = randomItem(allUnits)
        insertNote.run(generateId(), author.id, randomItem(noteBodies), "EQUIPMENT_UNIT",
          unit.id, null, null, null, now)
      } else if (sampleIssues.length) {
        const issue = randomItem(sampleIssues)
        insertNote.run(generateId(), author.id, randomItem(noteBodies), "ISSUE_REPORT",
          null, null, null, issue.id, now)
      }
    }
  })

  runSeed()
  console.log("Seed complete.")
}

try {
  main()
} catch (e) {
  console.error(e)
  process.exit(1)
} finally {
  db.close()
}
