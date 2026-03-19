import { PrismaClient, UserRole, EquipmentStatus, RentalStatus, MaintenanceStatus, MaintenanceTrigger, IssueSeverity, IssueStatus, NoteTargetType, AuditAction } from "@prisma/client";

const prisma = new PrismaClient();

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
];

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
];

const equipmentCatalog = [
  ["Hydraulic Excavator", "EARTH"],
  ["Large Mining Excavator", "MINING"],
  ["Electric Rope Shovel", "MINING"],
  ["Dragline Excavator", "MINING"],
  ["Wheel Loader", "EARTH"],
  ["Large Wheel Loader", "MINING"],
  ["Track Loader", "EARTH"],
  ["Skid Steer Loader", "EARTH"],
  ["Compact Track Loader", "EARTH"],
  ["Motor Grader", "EARTH"],
  ["Articulated Dump Truck", "HAUL"],
  ["Rigid Frame Haul Truck", "MINING"],
  ["Off-Highway Dump Truck", "HAUL"],
  ["Underground Mining Truck", "MINING"],
  ["Water Truck", "SUPPORT"],
  ["Fuel Service Truck", "SUPPORT"],
  ["Lube Service Truck", "SUPPORT"],
  ["Boom Truck", "LIFT"],
  ["Rough Terrain Crane", "LIFT"],
  ["All Terrain Crane", "LIFT"],
  ["Crawler Crane", "LIFT"],
  ["Tower Crane", "LIFT"],
  ["Mobile Crane", "LIFT"],
  ["Telehandler", "LIFT"],
  ["Reach Forklift", "LIFT"],
  ["Heavy Lift Forklift", "LIFT"],
  ["Container Handler", "LIFT"],
  ["Side Loader Forklift", "LIFT"],
  ["Pipe Layer", "PIPE"],
  ["Bulldozer", "EARTH"],
  ["High Horsepower Dozer", "MINING"],
  ["Crawler Tractor", "EARTH"],
  ["Wheel Dozer", "EARTH"],
  ["Soil Compactor", "COMPACT"],
  ["Padfoot Compactor", "COMPACT"],
  ["Vibratory Smooth Drum Roller", "COMPACT"],
  ["Tandem Asphalt Roller", "COMPACT"],
  ["Pneumatic Tire Roller", "COMPACT"],
  ["Asphalt Paver", "EARTH"],
  ["Cold Planer", "EARTH"],
  ["Soil Stabilizer", "EARTH"],
  ["Trench Cutter", "PIPE"],
  ["Chain Trencher", "PIPE"],
  ["Wheel Trencher", "PIPE"],
  ["Rock Saw Trencher", "PIPE"],
  ["Horizontal Directional Drill", "DRILL"],
  ["Large Rotary Drill Rig", "DRILL"],
  ["Blast Hole Drill Rig", "MINING"],
  ["Surface Mining Drill", "MINING"],
  ["Core Drill Rig", "DRILL"],
  ["Diamond Core Drill", "DRILL"],
  ["Reverse Circulation Drill", "DRILL"],
  ["Auger Drill Rig", "DRILL"],
  ["Pile Driver", "EARTH"],
  ["Hydraulic Pile Hammer", "EARTH"],
  ["Vibro Hammer", "EARTH"],
  ["Drilling Jumbo", "MINING"],
  ["Bolting Jumbo", "MINING"],
  ["Underground Loader", "MINING"],
  ["Underground Scooptram", "MINING"],
  ["Underground Personnel Carrier", "MINING"],
  ["Underground Shotcrete Sprayer", "MINING"],
  ["Underground Scaler", "MINING"],
  ["Underground Utility Vehicle", "MINING"],
  ["Mine Service Truck", "MINING"],
  ["Explosives Charging Unit", "MINING"],
  ["Shotcrete Pump", "CONCRETE"],
  ["Concrete Boom Pump", "CONCRETE"],
  ["Line Concrete Pump", "CONCRETE"],
  ["Concrete Mixer Truck", "CONCRETE"],
  ["Volumetric Concrete Mixer", "CONCRETE"],
  ["Batch Plant", "CONCRETE"],
  ["Mobile Concrete Batch Plant", "CONCRETE"],
  ["Cement Bulk Trailer", "CONCRETE"],
  ["Grout Pump", "CONCRETE"],
  ["Grout Mixing Plant", "CONCRETE"],
  ["Slurry Pump Unit", "PLANT"],
  ["Dewatering Pump Skid", "PLANT"],
  ["High Capacity Water Pump", "PLANT"],
  ["Diesel Generator 500kW", "POWER"],
  ["Diesel Generator 1MW", "POWER"],
  ["Gas Turbine Generator", "POWER"],
  ["Portable Power Generator", "POWER"],
  ["Mobile Substation", "POWER"],
  ["Transformer Skid", "POWER"],
  ["Electrical Switchgear Container", "POWER"],
  ["Cable Reel Trailer", "POWER"],
  ["Cable Pulling Winch", "POWER"],
  ["Pipe Welding Rig", "PIPE"],
  ["Automatic Welding System", "PIPE"],
  ["Pipe Bending Machine", "PIPE"],
  ["Pipe Threading Machine", "PIPE"],
  ["Pipe Handling Crane", "PIPE"],
  ["Pipe Transport Trailer", "PIPE"],
  ["Pipe Coating Machine", "PIPE"],
  ["Hydrostatic Pressure Test Pump", "PIPE"],
  ["Sandblasting Unit", "PLANT"],
  ["Industrial Pressure Washer", "PLANT"],
  ["Hydro Excavation Truck", "SUPPORT"],
  ["Vacuum Truck", "SUPPORT"],
  ["Combination Sewer Truck", "SUPPORT"],
  ["Industrial Vacuum Excavator", "SUPPORT"],
  ["Sludge Removal Truck", "SUPPORT"],
  ["Tank Cleaning Unit", "PLANT"],
  ["Mobile Flare System", "OILFIELD"],
  ["Gas Compression Unit", "OILFIELD"],
  ["Gas Dehydration Unit", "OILFIELD"],
  ["Pumpjack", "OILFIELD"],
  ["Well Service Rig", "OILFIELD"],
  ["Coil Tubing Unit", "OILFIELD"],
  ["Wireline Unit", "OILFIELD"],
  ["Workover Rig", "OILFIELD"],
  ["Fracturing Pump Truck", "OILFIELD"],
  ["Fracturing Blender", "OILFIELD"],
  ["Sand Storage System", "OILFIELD"],
  ["Sand Conveyor System", "OILFIELD"],
  ["Fluid Storage Tank", "OILFIELD"],
  ["Mud Pump", "OILFIELD"],
  ["Drilling Mud System", "OILFIELD"],
  ["Drill Pipe Handler", "OILFIELD"],
  ["Pipe Rack System", "OILFIELD"],
  ["Top Drive Drilling System", "OILFIELD"],
  ["BOP Handling System", "OILFIELD"],
  ["Wind Turbine Installation Crane", "POWER"],
  ["Wind Turbine Blade Transporter", "POWER"],
  ["Wind Turbine Tower Transporter", "POWER"],
  ["Transformer Transport Trailer", "POWER"],
  ["Self-Propelled Modular Transporter", "HAUL"],
  ["Heavy Haul Tractor", "HAUL"],
  ["Multi-Axle Lowboy Trailer", "HAUL"],
  ["Hydraulic Platform Trailer", "HAUL"],
  ["Industrial Material Handler", "PLANT"],
  ["Scrap Handler Excavator", "PLANT"],
  ["Log Loader", "HAUL"],
  ["Rail Mounted Crane", "RAIL"],
  ["Rail Maintenance Grinder", "RAIL"],
  ["Ballast Regulator", "RAIL"],
  ["Rail Tamper", "RAIL"],
  ["Rail Track Excavator", "RAIL"],
  ["Tunnel Boring Machine", "TUNNEL"],
  ["Micro Tunnel Boring Machine", "TUNNEL"],
  ["Roadheader", "TUNNEL"],
  ["Shaft Sinking Rig", "TUNNEL"],
  ["Raise Boring Machine", "TUNNEL"],
  ["Slurry Shield TBM", "TUNNEL"],
  ["LNG Pump Skid", "PLANT"],
  ["Cryogenic Storage Tank", "PLANT"],
  ["Industrial Cooling Tower", "PLANT"],
  ["Industrial Air Compressor", "PLANT"],
  ["High Pressure Air Compressor", "PLANT"],
  ["Nitrogen Pumping Unit", "PLANT"],
  ["Oxygen Generation System", "PLANT"],
  ["Industrial Chiller", "PLANT"],
  ["Heat Exchanger Skid", "PLANT"],
  ["Chemical Injection Skid", "PLANT"],
  ["Catalyst Handling System", "PLANT"],
  ["Reactor Vessel Transporter", "PLANT"],
  ["Industrial Furnace", "PLANT"],
  ["Coke Drum Cutting System", "PLANT"],
  ["Slag Handling Machine", "PLANT"],
  ["Steel Mill Ladle Crane", "PLANT"],
  ["Continuous Casting Machine", "PLANT"],
  ["Rolling Mill Stand", "PLANT"],
  ["Billet Handling Crane", "PLANT"],
  ["Nuclear Fuel Handling Machine", "POWER"],
  ["Reactor Vessel Crane", "POWER"],
  ["Spent Fuel Cask Transporter", "POWER"],
  ["Radiation Shielded Transport Vehicle", "POWER"],
  ["Reactor Coolant Pump", "POWER"],
  ["Turbine Generator Set", "POWER"],
  ["Cooling Water Pump Station", "POWER"],
  ["High Voltage Circuit Breaker Unit", "POWER"],
  ["Grid Power Transformer", "POWER"],
  ["Cable Laying Machine", "POWER"],
  ["High Mast Lighting Tower", "SUPPORT"],
  ["Mobile Lighting Plant", "SUPPORT"],
  ["Industrial Fire Truck", "SAFETY"],
  ["Industrial Foam Suppression Unit", "SAFETY"],
  ["Hazmat Response Vehicle", "SAFETY"],
  ["Confined Space Rescue Unit", "SAFETY"],
  ["Site Ambulance Unit", "SAFETY"],
  ["Mobile Command Center", "SAFETY"],
  ["Remote Inspection Drone System", "SAFETY"],
  ["Industrial Survey Drone System", "SAFETY"],
];

const manufacturers = [
  "Caterpillar",
  "Komatsu",
  "Liebherr",
  "Hitachi",
  "Volvo",
  "John Deere",
  "Sandvik",
  "Epiroc",
  "Terex",
  "Sany",
  "XCMG",
  "Manitowoc",
  "Kalmar",
  "Atlas Copco",
  "National Oilwell Varco",
  "Schramm",
  "Boart Longyear",
  "Putzmeister",
  "Zoomlion",
  "Mammoet",
];

const departments = ["Operations", "Field Services", "Maintenance", "Turnaround", "Projects", "Logistics"];
const jobSites = [
  "North Pit Expansion",
  "Steam Plant Upgrade",
  "Tailings Cell 4",
  "Pipeline Spread 7",
  "Refinery Turnaround Unit 12",
  "Cooling Water Upgrade",
  "Crusher Relocation",
  "Substation Expansion",
  "Well Pad 14B",
  "Tank Farm Rehabilitation",
];

const noteBodies = [
  "Operator reported intermittent hydraulic pressure drop.",
  "Routine inspection completed with no major concerns.",
  "Unit should be prioritized for next service window.",
  "Observed minor wear on track assembly.",
  "Awaiting parts before maintenance can proceed.",
  "Equipment returned in acceptable condition.",
  "Temporary restriction applied pending maintenance review.",
  "Technician recommends follow-up inspection in 14 days.",
];

const issueTitles = [
  "Hydraulic leak detected",
  "Excessive vibration during operation",
  "Electrical fault warning",
  "Brake response inconsistent",
  "Track wear above acceptable threshold",
  "Boom control lag reported",
  "Engine overheating under load",
  "Cab display intermittently failing",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateWithinPast(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysBack));
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function slugCode(name: string) {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 6);
}

function uniqueWithCounter(base: string, used: Set<string>) {
  let next = base;
  let counter = 2;
  while (used.has(next)) {
    next = `${base}-${counter}`;
    counter++;
  }
  used.add(next);
  return next;
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.issueReport.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.equipmentUnit.deleteMany();
  await prisma.equipmentType.deleteMany();
  await prisma.equipmentCategory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  const createdCategories = new Map<string, { id: string; code: string }>();
  for (const category of categories) {
    const created = await prisma.equipmentCategory.create({ data: category });
    createdCategories.set(category.code, created);
  }

  const createdLocations = [];
  for (const location of locations) {
    const created = await prisma.location.create({ data: location });
    createdLocations.push(created);
  }

  const users = [];

  const adminProfiles = [
    { name: "Robert MacMillan", position: "Operations Director" },
    { name: "Sarah Jenkins", position: "Fleet Manager" },
    { name: "David Chen", position: "Site Superintendent" },
    { name: "Amanda Torres", position: "Logistics Coordinator" },
    { name: "Michael O'Connor", position: "HSE Manager" },
    { name: "Lisa Wong", position: "Equipment Dispatcher" }
  ];

  for (let i = 0; i < adminProfiles.length; i++) {
    users.push(await prisma.user.create({
      data: {
        name: adminProfiles[i].name,
        email: `admin${i + 1}@equiptrack.local`,
        role: UserRole.ADMIN,
        department: "Administration",
        phoneNumber: `555-010${i}`,
        position: adminProfiles[i].position,
        isAvatarIcon: true,
        avatarUrl: randomItem(["hardhat", "wrench", "truck", "clipboard", "gear"]),
      },
    }));
  }

  const fieldWorkerNames = [
    "James Smith", "Maria Garcia", "John Johnson", "Robert Williams",
    "Michael Brown", "William Jones", "David Miller", "Richard Davis",
    "Joseph Garcia", "Thomas Rodriguez", "Charles Wilson", "Christopher Martinez",
    "Daniel Anderson", "Matthew Taylor", "Anthony Thomas", "Mark Hernandez",
    "Donald Moore", "Steven Martin"
  ];

  for (let i = 0; i < fieldWorkerNames.length; i++) {
    users.push(await prisma.user.create({
      data: {
        name: fieldWorkerNames[i],
        email: `field${i + 1}@equiptrack.local`,
        role: UserRole.FIELD_WORKER,
        department: randomItem(departments),
        phoneNumber: `555-020${String(i).padStart(2, '0')}`,
        position: randomItem(["Heavy Equipment Operator", "Site Supervisor", "Foreman", "Laborer", "Surveyor"]),
        isAvatarIcon: true,
        avatarUrl: randomItem(["hardhat", "truck", "clipboard"]),
      },
    }));
  }

  const maintenanceNames = [
    "Paul Lee", "Kevin Perez", "Brian Thompson", "George White",
    "Edward Harris", "Ronald Sanchez", "Timothy Clark", "Jason Ramirez",
    "Jeffrey Lewis", "Ryan Robinson", "Jacob Walker", "Gary Young"
  ];

  for (let i = 0; i < maintenanceNames.length; i++) {
    users.push(await prisma.user.create({
      data: {
        name: maintenanceNames[i],
        email: `maintenance${i + 1}@equiptrack.local`,
        role: UserRole.MAINTENANCE,
        department: "Maintenance",
        phoneNumber: `555-030${String(i).padStart(2, '0')}`,
        position: randomItem(["Heavy Duty Mechanic", "Welder", "Electrical Technician", "Service Truck Operator", "Shop Foreman"]),
        isAvatarIcon: true,
        avatarUrl: randomItem(["wrench", "gear", "hardhat"]),
      },
    }));
  }

  const admins = users.filter((u) => u.role === UserRole.ADMIN);
  const fieldWorkers = users.filter((u) => u.role === UserRole.FIELD_WORKER);
  const maintenanceUsers = users.filter((u) => u.role === UserRole.MAINTENANCE);

  const createdTypes = [];
  const usedTypeCodes = new Set<string>();

  for (const [name, categoryCode] of equipmentCatalog) {
    const manufacturer = randomItem(manufacturers);
    const model = `${slugCode(name)}-${randomInt(100, 999)}`;
    const defaultMaintenanceDays = randomItem([30, 45, 60, 90, 120, 180]);
    const requiresApproval = Math.random() < 0.45;
    const highRisk = Math.random() < 0.2;

    const typeCode = uniqueWithCounter(`${slugCode(name)}-${randomInt(10, 99)}`, usedTypeCodes);

    const created = await prisma.equipmentType.create({
      data: {
        name,
        code: typeCode,
        manufacturer,
        model,
        categoryId: createdCategories.get(categoryCode)!.id,
        description: `${name} used for industrial and heavy civil operations.`,
        defaultMaintenanceDays,
        defaultRentalWarningDays: randomItem([3, 5, 7, 10, 14]),
        requiresApproval,
        highRisk,
      },
    });

    createdTypes.push(created);
  }

  const allUnits: { id: string; assetTag: string; nextMaintenanceDue: Date | null }[] = [];
  const usedAssetTags = new Set<string>();
  const usedSerialNumbers = new Set<string>();

  for (const equipmentType of createdTypes) {
    const unitCount = randomInt(3, 8); // 200 types x avg ~5.5 = 1100 units
    const typeCode = equipmentType.code.replace(/[^A-Z0-9-]/g, "").slice(0, 8);

    for (let i = 1; i <= unitCount; i++) {
      const location = randomItem(createdLocations);
      const lastMaintenanceAt = randomDateWithinPast(180);
      const nextMaintenanceDue = addDays(
        lastMaintenanceAt,
        equipmentType.defaultMaintenanceDays ?? 90
      );

      let status: EquipmentStatus = EquipmentStatus.AVAILABLE;
      const roll = Math.random();

      if (roll < 0.65) status = EquipmentStatus.AVAILABLE;
      else if (roll < 0.73) status = EquipmentStatus.RESERVED;
      else if (roll < 0.83) status = EquipmentStatus.CHECKED_OUT;
      else if (roll < 0.88) status = EquipmentStatus.DUE_SOON_MAINTENANCE;
      else if (roll < 0.95) status = EquipmentStatus.IN_MAINTENANCE;
      else status = EquipmentStatus.OUT_OF_SERVICE;

      const assetTag = uniqueWithCounter(`${typeCode}-${String(i).padStart(3, "0")}`, usedAssetTags);
      const serialNumber = uniqueWithCounter(`SN-${typeCode}-${randomInt(100000, 999999)}`, usedSerialNumbers);

      const unit = await prisma.equipmentUnit.create({
        data: {
          assetTag,
          serialNumber,
          equipmentTypeId: equipmentType.id,
          locationId: location.id,
          status,
          year: randomInt(2012, 2026),
          inServiceDate: randomDateWithinPast(1800),
          lastMaintenanceAt,
          nextMaintenanceDue,
          notesSummary: Math.random() < 0.25 ? "Monitor for upcoming service interval." : null,
          isActive: true,
        },
      });

      allUnits.push({ id: unit.id, assetTag: unit.assetTag, nextMaintenanceDue });
    }
  }

  for (let i = 0; i < 260; i++) {
    const unit = randomItem(allUnits);
    const requester = randomItem(fieldWorkers);
    const approver = Math.random() < 0.8 ? randomItem(admins) : null;
    const location = randomItem(createdLocations);
    const equipmentUnit = await prisma.equipmentUnit.findUnique({
      where: { id: unit.id },
      include: { equipmentType: true },
    });

    if (!equipmentUnit) continue;

    const requestedStart = randomDateWithinPast(60);
    const requestedEnd = addDays(requestedStart, randomInt(2, 21));

    let status: RentalStatus = RentalStatus.PENDING;
    const roll = Math.random();

    if (roll < 0.15) status = RentalStatus.PENDING;
    else if (roll < 0.22) status = RentalStatus.REJECTED;
    else if (roll < 0.36) status = RentalStatus.APPROVED;
    else if (roll < 0.48) status = RentalStatus.RESERVED;
    else if (roll < 0.72) status = RentalStatus.CHECKED_OUT;
    else if (roll < 0.92) status = RentalStatus.RETURNED;
    else status = RentalStatus.OVERDUE;

    const checkedOutBy = status === RentalStatus.CHECKED_OUT || status === RentalStatus.RETURNED || status === RentalStatus.OVERDUE
      ? randomItem(admins)
      : null;

    const returnedBy = status === RentalStatus.RETURNED
      ? randomItem(admins)
      : null;

    const rental = await prisma.rental.create({
      data: {
        equipmentUnitId: equipmentUnit.id,
        equipmentTypeId: equipmentUnit.equipmentTypeId,
        requesterId: requester.id,
        approverId: approver?.id,
        checkedOutById: checkedOutBy?.id,
        returnedById: returnedBy?.id,
        locationId: location.id,
        status,
        reason: `Required for ${randomItem(jobSites)} support operations.`,
        jobSite: randomItem(jobSites),
        requestedStart,
        requestedEnd,
        approvedStart: approver ? requestedStart : null,
        approvedEnd: approver ? requestedEnd : null,
        checkedOutAt: (status === RentalStatus.CHECKED_OUT || status === RentalStatus.RETURNED || status === RentalStatus.OVERDUE) ? requestedStart : null,
        returnedAt: status === RentalStatus.RETURNED ? requestedEnd : null,
        rejectedReason: status === RentalStatus.REJECTED ? "Conflicts with existing booking window." : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: AuditAction.REQUEST_SUBMITTED,
        actorId: requester.id,
        rentalId: rental.id,
        equipmentUnitId: equipmentUnit.id,
        message: `Rental request submitted for ${equipmentUnit.assetTag}.`,
      },
    });

    if (approver) {
      await prisma.auditLog.create({
        data: {
          action: status === RentalStatus.REJECTED ? AuditAction.REQUEST_REJECTED : AuditAction.REQUEST_APPROVED,
          actorId: approver.id,
          rentalId: rental.id,
          equipmentUnitId: equipmentUnit.id,
          message: `Rental ${status.toLowerCase()} by admin.`,
        },
      });
    }
  }

  const createdIssues: { id: string }[] = [];

  for (let i = 0; i < 180; i++) {
    const unit = randomItem(allUnits);
    const reporter = randomItem(fieldWorkers);
    const severity = randomItem([
      IssueSeverity.LOW,
      IssueSeverity.MEDIUM,
      IssueSeverity.HIGH,
      IssueSeverity.CRITICAL,
    ]);

    const status = randomItem([
      IssueStatus.OPEN,
      IssueStatus.REVIEWED,
      IssueStatus.IN_PROGRESS,
      IssueStatus.RESOLVED,
    ]);

    const issue = await prisma.issueReport.create({
      data: {
        equipmentUnitId: unit.id,
        reportedById: reporter.id,
        title: randomItem(issueTitles),
        description: "Reported from field operations. Requires inspection and disposition.",
        severity,
        status,
        reportedAt: randomDateWithinPast(120),
        resolvedAt: status === IssueStatus.RESOLVED ? randomDateWithinPast(30) : null,
      },
    });

    createdIssues.push(issue);

    await prisma.auditLog.create({
      data: {
        action: AuditAction.ISSUE_REPORTED,
        actorId: reporter.id,
        issueReportId: issue.id,
        equipmentUnitId: unit.id,
        message: `Issue reported against ${unit.assetTag}.`,
      },
    });
  }

  for (let i = 0; i < 320; i++) {
    const unit = randomItem(allUnits);
    const tech = Math.random() < 0.85 ? randomItem(maintenanceUsers) : null;
    const createdAt = randomDateWithinPast(180);
    const trigger = randomItem([
      MaintenanceTrigger.ROUTINE,
      MaintenanceTrigger.ISSUE_REPORTED,
      MaintenanceTrigger.INSPECTION,
      MaintenanceTrigger.BREAKDOWN,
      MaintenanceTrigger.ADMIN_REQUEST,
    ]);

    let issueReportId = null;
    if (trigger === MaintenanceTrigger.ISSUE_REPORTED && createdIssues.length > 0) {
      issueReportId = randomItem(createdIssues).id;
    }

    let status = randomItem([
      MaintenanceStatus.OPEN,
      MaintenanceStatus.SCHEDULED,
      MaintenanceStatus.IN_PROGRESS,
      MaintenanceStatus.COMPLETED,
    ]);

    const startedAt =
      status === MaintenanceStatus.IN_PROGRESS || status === MaintenanceStatus.COMPLETED
        ? addDays(createdAt, randomInt(0, 5))
        : null;

    const completedAt =
      status === MaintenanceStatus.COMPLETED && startedAt
        ? addDays(startedAt, randomInt(1, 10))
        : null;

    const record = await prisma.maintenanceRecord.create({
      data: {
        equipmentUnitId: unit.id,
        technicianId: tech?.id,
        status,
        trigger,
        issueReportId,
        title: `${trigger.replace("_", " ")} maintenance`,
        description: "Inspection, servicing, and corrective work as required.",
        scheduledFor: addDays(createdAt, randomInt(1, 14)),
        startedAt,
        completedAt,
        nextDueAt: completedAt ? addDays(completedAt, randomItem([30, 60, 90, 120])) : null,
        createdAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: status === MaintenanceStatus.COMPLETED ? AuditAction.MAINTENANCE_COMPLETED : AuditAction.MAINTENANCE_OPENED,
        actorId: tech?.id ?? null,
        maintenanceRecordId: record.id,
        equipmentUnitId: unit.id,
        message: `Maintenance record ${status.toLowerCase()} for equipment unit.`,
      },
    });
  }

  const rentals = await prisma.rental.findMany({ take: 100 });
  const maintenanceRecords = await prisma.maintenanceRecord.findMany({ take: 100 });
  const issues = await prisma.issueReport.findMany({ take: 100 });

  for (let i = 0; i < 300; i++) {
    const author = randomItem(users);
    const targetPick = randomInt(1, 4);

    if (targetPick === 1) {
      const unit = randomItem(allUnits);
      await prisma.note.create({
        data: {
          authorId: author.id,
          body: randomItem(noteBodies),
          targetType: NoteTargetType.EQUIPMENT_UNIT,
          equipmentUnitId: unit.id,
        },
      });
    } else if (targetPick === 2 && rentals.length) {
      const rental = randomItem(rentals);
      await prisma.note.create({
        data: {
          authorId: author.id,
          body: randomItem(noteBodies),
          targetType: NoteTargetType.RENTAL,
          rentalId: rental.id,
        },
      });
    } else if (targetPick === 3 && maintenanceRecords.length) {
      const maintenance = randomItem(maintenanceRecords);
      await prisma.note.create({
        data: {
          authorId: author.id,
          body: randomItem(noteBodies),
          targetType: NoteTargetType.MAINTENANCE_RECORD,
          maintenanceRecordId: maintenance.id,
        },
      });
    } else if (issues.length) {
      const issue = randomItem(issues);
      await prisma.note.create({
        data: {
          authorId: author.id,
          body: randomItem(noteBodies),
          targetType: NoteTargetType.ISSUE_REPORT,
          issueReportId: issue.id,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
