-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalesRep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `countryId` INTEGER NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `region_id` INTEGER NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `route_id` INTEGER NOT NULL,
    `route` VARCHAR(100) NOT NULL,
    `route_id_update` INTEGER NOT NULL,
    `route_name_update` VARCHAR(100) NOT NULL,
    `visits_targets` INTEGER NOT NULL,
    `new_clients` INTEGER NOT NULL,
    `role` VARCHAR(191) NULL DEFAULT 'SALES_REP',
    `manager_type` INTEGER NOT NULL,
    `status` INTEGER NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `retail_manager` INTEGER NOT NULL,
    `key_channel_manager` INTEGER NOT NULL,
    `distribution_manager` INTEGER NOT NULL,
    `photoUrl` VARCHAR(191) NULL DEFAULT '',
    `managerId` INTEGER NULL,

    UNIQUE INDEX `SalesRep_email_key`(`email`),
    UNIQUE INDEX `SalesRep_phoneNumber_key`(`phoneNumber`),
    INDEX `SalesRep_countryId_fkey`(`countryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `loginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logoutAt` DATETIME(3) NULL,
    `isLate` BOOLEAN NULL DEFAULT false,
    `isEarly` BOOLEAN NULL DEFAULT false,
    `timezone` VARCHAR(191) NULL DEFAULT 'UTC',
    `shiftStart` DATETIME(3) NULL,
    `shiftEnd` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `status` VARCHAR(191) NULL DEFAULT 'ACTIVE',
    `sessionEnd` VARCHAR(191) NULL,
    `sessionStart` VARCHAR(191) NULL,

    INDEX `LoginHistory_userId_idx`(`userId`),
    INDEX `LoginHistory_loginAt_idx`(`loginAt`),
    INDEX `LoginHistory_logoutAt_idx`(`logoutAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Target` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `salesRepId` INTEGER NOT NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `targetValue` INTEGER NOT NULL,
    `achievedValue` INTEGER NOT NULL DEFAULT 0,
    `achieved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Target_salesRepId_fkey`(`salesRepId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `managers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `department` VARCHAR(191) NULL,

    UNIQUE INDEX `managers_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Token` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(191) NOT NULL,
    `salesRepId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `blacklisted` BOOLEAN NOT NULL DEFAULT false,
    `lastUsedAt` DATETIME(3) NULL,

    INDEX `Token_userId_fkey`(`salesRepId`),
    INDEX `Token_blacklisted_idx`(`blacklisted`),
    INDEX `Token_lastUsedAt_idx`(`lastUsedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Regions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `countryId` INTEGER NOT NULL,
    `status` INTEGER NULL DEFAULT 0,

    INDEX `Regions_countryId_fkey`(`countryId`),
    UNIQUE INDEX `Regions_name_countryId_key`(`name`, `countryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Country` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `status` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PriceOption` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `option` VARCHAR(191) NOT NULL,
    `value` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,

    INDEX `PriceOption_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreQuantity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quantity` INTEGER NOT NULL,
    `storeId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,

    INDEX `StoreQuantity_productId_fkey`(`productId`),
    INDEX `StoreQuantity_storeId_fkey`(`storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `regionId` INTEGER NULL,
    `client_type` INTEGER NULL,
    `countryId` INTEGER NOT NULL,
    `region_id` INTEGER NULL,
    `status` INTEGER NOT NULL DEFAULT 0,

    INDEX `Stores_regionId_fkey`(`regionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `unit_cost` DECIMAL(11, 2) NOT NULL,
    `description` VARCHAR(191) NULL,
    `currentStock` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `clientId` INTEGER NULL,
    `image` VARCHAR(191) NULL DEFAULT '',

    INDEX `Product_clientId_fkey`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransferHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `fromStoreId` INTEGER NOT NULL,
    `toStoreId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `transferredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TransferHistory_fromStoreId_fkey`(`fromStoreId`),
    INDEX `TransferHistory_productId_fkey`(`productId`),
    INDEX `TransferHistory_toStoreId_fkey`(`toStoreId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `date` VARCHAR(100) NOT NULL DEFAULT 'current_timestamp(3)',
    `reference` VARCHAR(191) NOT NULL,
    `quantityIn` INTEGER NOT NULL,
    `quantityOut` INTEGER NOT NULL,
    `newBalance` INTEGER NOT NULL,
    `storeId` INTEGER NOT NULL,
    `staff` INTEGER NOT NULL,
    `staff_name` VARCHAR(100) NOT NULL,
    `update_date` VARCHAR(50) NOT NULL,

    INDEX `ProductDetails_productId_fkey`(`productId`),
    INDEX `ProductDetails_storeId_fkey`(`storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Purchase` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `storeId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `supplierId` INTEGER NOT NULL,
    `totalAmount` INTEGER NOT NULL,

    INDEX `Purchase_storeId_fkey`(`storeId`),
    INDEX `Purchase_supplierId_fkey`(`supplierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchaseId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,

    INDEX `PurchaseItem_productId_fkey`(`productId`),
    INDEX `PurchaseItem_purchaseId_fkey`(`purchaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `storeId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `previousQuantity` INTEGER NOT NULL,
    `purchaseQuantity` INTEGER NOT NULL,
    `newBalance` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PurchaseHistory_productId_fkey`(`productId`),
    INDEX `PurchaseHistory_storeId_fkey`(`storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Clients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `salesRepId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `balance` DECIMAL(11, 2) NULL,
    `email` VARCHAR(191) NULL,
    `region_id` INTEGER NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `route_id` INTEGER NULL,
    `route_name` VARCHAR(191) NULL,
    `route_id_update` INTEGER NULL,
    `route_name_update` VARCHAR(100) NULL,
    `contact` VARCHAR(191) NOT NULL,
    `tax_pin` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `client_type` INTEGER NULL,
    `countryId` INTEGER NOT NULL,
    `added_by` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Clients_countryId_fkey`(`countryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientPayment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NULL,
    `method` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,

    INDEX `ClientPayment_clientId_fkey`(`clientId`),
    INDEX `ClientPayment_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Riders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `contact` VARCHAR(191) NOT NULL,
    `id_number` VARCHAR(191) NOT NULL,
    `company_id` INTEGER NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `status` INTEGER NULL,
    `password` VARCHAR(191) NULL,
    `device_id` VARCHAR(191) NULL,
    `device_name` VARCHAR(191) NULL,
    `device_status` VARCHAR(191) NULL,
    `token` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RidersCompany` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `status` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ManagerCheckin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `managerId` INTEGER NOT NULL,
    `clientId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `checkInAt` DATETIME(3) NULL,
    `checkOutAt` DATETIME(3) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,
    `checkoutLatitude` DOUBLE NULL,
    `checkoutLongitude` DOUBLE NULL,
    `imageUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NULL,
    `visitDuration` INTEGER NULL,
    `visitNumber` INTEGER NULL,

    INDEX `ManagerCheckin_managerId_idx`(`managerId`),
    INDEX `ManagerCheckin_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `priceOptionId` INTEGER NULL,

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_priceOptionId_idx`(`priceOptionId`),
    INDEX `OrderItem_productId_fkey`(`productId`),
    UNIQUE INDEX `OrderItem_orderId_productId_priceOptionId_key`(`orderId`, `productId`, `priceOptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MyOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `totalAmount` DOUBLE NOT NULL,
    `amountPaid` DECIMAL(11, 2) NOT NULL,
    `balance` DECIMAL(11, 2) NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `customerType` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `orderDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `riderId` INTEGER NULL,
    `riderName` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `approvedTime` VARCHAR(191) NULL,
    `dispatchTime` VARCHAR(191) NULL,
    `deliveryLocation` VARCHAR(191) NULL,
    `complete_latitude` VARCHAR(191) NULL,
    `complete_longitude` VARCHAR(191) NULL,
    `complete_address` VARCHAR(191) NULL,
    `pickupTime` VARCHAR(191) NULL,
    `deliveryTime` VARCHAR(191) NULL,
    `cancel_reason` VARCHAR(191) NULL,
    `recepient` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,
    `clientId` INTEGER NOT NULL,
    `countryId` INTEGER NOT NULL,
    `regionId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `approved_by` VARCHAR(200) NOT NULL,
    `approved_by_name` VARCHAR(200) NOT NULL,
    `storeId` INTEGER NULL,
    `retail_manager` INTEGER NOT NULL,
    `key_channel_manager` INTEGER NOT NULL,
    `distribution_manager` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NULL,

    INDEX `MyOrder_userId_idx`(`userId`),
    INDEX `MyOrder_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JourneyPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `checkInTime` DATETIME(3) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `imageUrl` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `checkoutLatitude` DOUBLE NULL,
    `checkoutLongitude` DOUBLE NULL,
    `checkoutTime` DATETIME(3) NULL,
    `showUpdateLocation` BOOLEAN NOT NULL DEFAULT true,
    `routeId` INTEGER NULL,

    INDEX `JourneyPlan_clientId_idx`(`clientId`),
    INDEX `JourneyPlan_userId_idx`(`userId`),
    INDEX `JourneyPlan_routeId_fkey`(`routeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NoticeBoard` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `countryId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NULL,
    `clientId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `journeyPlanId` INTEGER NULL,
    `type` ENUM('PRODUCT_AVAILABILITY', 'VISIBILITY_ACTIVITY', 'PRODUCT_SAMPLE', 'PRODUCT_RETURN', 'FEEDBACK') NOT NULL,

    INDEX `Report_userId_idx`(`userId`),
    INDEX `Report_orderId_idx`(`orderId`),
    INDEX `Report_clientId_idx`(`clientId`),
    INDEX `Report_journeyPlanId_idx`(`journeyPlanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeedbackReport` (
    `reportId` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` INTEGER NOT NULL,
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `FeedbackReport_reportId_key`(`reportId`),
    INDEX `FeedbackReport_userId_idx`(`userId`),
    INDEX `FeedbackReport_clientId_idx`(`clientId`),
    INDEX `FeedbackReport_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductReport` (
    `reportId` INTEGER NOT NULL,
    `productName` VARCHAR(191) NULL,
    `quantity` INTEGER NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` INTEGER NOT NULL,
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `productId` INTEGER NULL,

    INDEX `ProductReport_userId_idx`(`userId`),
    INDEX `ProductReport_clientId_idx`(`clientId`),
    INDEX `ProductReport_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisibilityReport` (
    `reportId` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clientId` INTEGER NOT NULL,
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `VisibilityReport_reportId_key`(`reportId`),
    INDEX `VisibilityReport_userId_idx`(`userId`),
    INDEX `VisibilityReport_clientId_idx`(`clientId`),
    INDEX `VisibilityReport_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductReturn` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NOT NULL,
    `productName` VARCHAR(191) NULL,
    `quantity` INTEGER NULL,
    `reason` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `clientId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `staff_name` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `ProductReturn_reportId_key`(`reportId`),
    INDEX `ProductReturn_userId_idx`(`userId`),
    INDEX `ProductReturn_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductsSample` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NOT NULL,
    `productName` VARCHAR(191) NULL,
    `quantity` INTEGER NULL,
    `reason` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `clientId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `ProductsSample_reportId_key`(`reportId`),
    INDEX `ProductsSample_userId_idx`(`userId`),
    INDEX `ProductsSample_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductReturnItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productReturnId` INTEGER NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `clientId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    INDEX `ProductReturnItem_productReturnId_idx`(`productReturnId`),
    INDEX `ProductReturnItem_userId_idx`(`userId`),
    INDEX `ProductReturnItem_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductsSampleItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productsSampleId` INTEGER NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `clientId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    INDEX `ProductsSampleItem_productsSampleId_idx`(`productsSampleId`),
    INDEX `ProductsSampleItem_userId_idx`(`userId`),
    INDEX `ProductsSampleItem_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leaves` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `leaveType` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `attachment` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `leaves_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UpliftSale` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UpliftSale_clientId_fkey`(`clientId`),
    INDEX `UpliftSale_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UpliftSaleItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `upliftSaleId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UpliftSaleItem_productId_fkey`(`productId`),
    INDEX `UpliftSaleItem_upliftSaleId_fkey`(`upliftSaleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Suppliers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `accountBalance` DOUBLE NOT NULL DEFAULT 0,
    `contact` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupplierHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplier_id` INTEGER NOT NULL,
    `ref_id` INTEGER NOT NULL,
    `reference` VARCHAR(100) NOT NULL,
    `date` VARCHAR(50) NOT NULL,
    `amount_in` DECIMAL(11, 2) NOT NULL,
    `amount_out` DECIMAL(11, 2) NOT NULL,
    `balance` DECIMAL(11, 2) NOT NULL,
    `staff` INTEGER NOT NULL,
    `staff_name` VARCHAR(100) NOT NULL,
    `updated_date` VARCHAR(100) NOT NULL,

    INDEX `SupplierHistory_supplierId_fkey`(`supplier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `department` INTEGER NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `account_code` VARCHAR(32) NOT NULL,
    `firstname` VARCHAR(255) NULL,
    `lastname` VARCHAR(255) NULL,
    `facebook_id` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(32) NOT NULL,
    `gender` VARCHAR(32) NOT NULL,
    `country` VARCHAR(99) NOT NULL,
    `image` VARCHAR(999) NOT NULL,
    `created` DATETIME(0) NULL,
    `modified` DATETIME(0) NULL,
    `status` BOOLEAN NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `salesRepId` INTEGER NOT NULL,
    `assignedById` INTEGER NULL,

    INDEX `tasks_assignedById_idx`(`assignedById`),
    INDEX `tasks_salesRepId_fkey`(`salesRepId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `region` INTEGER NOT NULL,
    `region_name` VARCHAR(100) NOT NULL,
    `country_id` INTEGER NOT NULL,
    `country_name` VARCHAR(100) NOT NULL,
    `leader_id` INTEGER NOT NULL,
    `leader_name` VARCHAR(100) NOT NULL,
    `status` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `reference` VARCHAR(200) NOT NULL,
    `amount_in` DECIMAL(10, 2) NOT NULL,
    `amount_out` DECIMAL(10, 2) NOT NULL,
    `balance` DECIMAL(10, 2) NOT NULL,
    `my_date` VARCHAR(50) NOT NULL,
    `createdAt` VARCHAR(50) NOT NULL,
    `staff` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tb1_id` INTEGER NOT NULL,
    `piece_id` VARCHAR(200) NOT NULL,
    `product_name` VARCHAR(200) NOT NULL,
    `quantity` VARCHAR(200) NOT NULL,
    `rate` DECIMAL(11, 2) NOT NULL,
    `total` DECIMAL(11, 2) NOT NULL,
    `month` VARCHAR(100) NOT NULL,
    `year` VARCHAR(100) NOT NULL,
    `created_date` VARCHAR(100) NOT NULL,
    `my_date` VARCHAR(100) NOT NULL,
    `status` INTEGER NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `staff` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplier` INTEGER NOT NULL,
    `comment` VARCHAR(250) NOT NULL,
    `store` VARCHAR(11) NOT NULL,
    `amount` DECIMAL(11, 2) NOT NULL,
    `paid` DECIMAL(11, 2) NOT NULL,
    `remain` DECIMAL(11, 2) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `month` VARCHAR(200) NOT NULL,
    `year` VARCHAR(200) NOT NULL,
    `purchase_date` VARCHAR(100) NOT NULL,
    `my_date` VARCHAR(20) NOT NULL,
    `staff` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_take` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `store_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `expected_quantity` INTEGER NOT NULL,
    `counted_quantity` INTEGER NOT NULL,
    `difference` INTEGER NOT NULL,
    `stock_take_date` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_transfer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `from_store` INTEGER NOT NULL,
    `to_store` INTEGER NOT NULL,
    `staff` INTEGER NOT NULL,
    `staff_name` VARCHAR(100) NOT NULL,
    `transfer_date` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_update` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_id` INTEGER NOT NULL,
    `reference` VARCHAR(250) NOT NULL,
    `amount` DECIMAL(11, 2) NOT NULL,
    `amount_in` DECIMAL(11, 2) NOT NULL,
    `amount_out` DECIMAL(11, 2) NOT NULL,
    `balance` DECIMAL(11, 2) NOT NULL,
    `transaction_date` VARCHAR(100) NOT NULL,
    `update_date` VARCHAR(100) NOT NULL,
    `staff_id` INTEGER NOT NULL,
    `staff_name` VARCHAR(100) NOT NULL,
    `notes` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(100) NOT NULL,
    `balance` DECIMAL(11, 2) NOT NULL,
    `status` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payment_id` INTEGER NOT NULL,
    `vendor_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `order_date` DATETIME(0) NOT NULL,
    `admin_id` INTEGER NOT NULL,
    `notes` TEXT NOT NULL,
    `total` DECIMAL(11, 2) NOT NULL,
    `paid` DECIMAL(11, 2) NOT NULL,
    `status` VARCHAR(30) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseOrderItems` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `po_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_cost` DECIMAL(11, 2) NOT NULL,
    `received_quantity` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `comment` TEXT NOT NULL,
    `date` VARCHAR(100) NOT NULL,
    `doc` VARCHAR(200) NOT NULL,
    `createdAt` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `transaction_date` DATETIME(0) NOT NULL,
    `quantity_in` INTEGER NOT NULL,
    `quantity_out` INTEGER NULL DEFAULT 0,
    `reference` VARCHAR(50) NOT NULL,
    `reference_id` INTEGER NOT NULL,
    `balance` INTEGER NOT NULL,
    `notes` TEXT NULL,

    INDEX `product_id`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountTypes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_type` VARCHAR(100) NOT NULL,
    `account_category` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expense_type_id` INTEGER NOT NULL,
    `reference` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `paid` DECIMAL(11, 2) NOT NULL,
    `balance` DECIMAL(11, 2) NOT NULL,
    `expense_date` DATE NOT NULL,
    `posted_by` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `posted_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `expense_type_id`(`expense_type_id`),
    INDEX `posted_by`(`posted_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MyAccounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_name` VARCHAR(100) NOT NULL,
    `account_number` VARCHAR(20) NOT NULL,
    `account_type` INTEGER NOT NULL,
    `description` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pay` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expense_id` INTEGER NOT NULL,
    `account_id` INTEGER NOT NULL,
    `amount` DECIMAL(11, 2) NOT NULL,
    `reference` TEXT NOT NULL,
    `payment_date` VARCHAR(100) NOT NULL,
    `posted_by` INTEGER NOT NULL,
    `notes` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(11, 2) NOT NULL,
    `payment_date` VARCHAR(100) NOT NULL,
    `method` VARCHAR(100) NOT NULL,
    `notes` TEXT NOT NULL,
    `admin_id` INTEGER NOT NULL,
    `status` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `po_id` INTEGER NOT NULL,
    `vendor_id` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL,
    `reference` VARCHAR(100) NULL,
    `payment_date` DATE NOT NULL,
    `notes` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL,

    INDEX `po_id`(`po_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_MyOrderToReport` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_MyOrderToReport_AB_unique`(`A`, `B`),
    INDEX `_MyOrderToReport_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SalesRep` ADD CONSTRAINT `SalesRep_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoginHistory` ADD CONSTRAINT `LoginHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Target` ADD CONSTRAINT `Target_salesRepId_fkey` FOREIGN KEY (`salesRepId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `managers` ADD CONSTRAINT `managers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Token` ADD CONSTRAINT `Token_salesRepId_fkey` FOREIGN KEY (`salesRepId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Regions` ADD CONSTRAINT `Regions_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceOption` ADD CONSTRAINT `PriceOption_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreQuantity` ADD CONSTRAINT `StoreQuantity_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreQuantity` ADD CONSTRAINT `StoreQuantity_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stores` ADD CONSTRAINT `Stores_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Regions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransferHistory` ADD CONSTRAINT `TransferHistory_fromStoreId_fkey` FOREIGN KEY (`fromStoreId`) REFERENCES `Stores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransferHistory` ADD CONSTRAINT `TransferHistory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransferHistory` ADD CONSTRAINT `TransferHistory_toStoreId_fkey` FOREIGN KEY (`toStoreId`) REFERENCES `Stores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductDetails` ADD CONSTRAINT `ProductDetails_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductDetails` ADD CONSTRAINT `ProductDetails_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseItem` ADD CONSTRAINT `PurchaseItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseItem` ADD CONSTRAINT `PurchaseItem_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `Purchase`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseHistory` ADD CONSTRAINT `PurchaseHistory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseHistory` ADD CONSTRAINT `PurchaseHistory_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Stores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Clients` ADD CONSTRAINT `Clients_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Clients` ADD CONSTRAINT `Clients_salesRepId_fkey` FOREIGN KEY (`salesRepId`) REFERENCES `SalesRep`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientPayment` ADD CONSTRAINT `ClientPayment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientPayment` ADD CONSTRAINT `ClientPayment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManagerCheckin` ADD CONSTRAINT `ManagerCheckin_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManagerCheckin` ADD CONSTRAINT `ManagerCheckin_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `managers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `MyOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_priceOptionId_fkey` FOREIGN KEY (`priceOptionId`) REFERENCES `PriceOption`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MyOrder` ADD CONSTRAINT `MyOrder_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MyOrder` ADD CONSTRAINT `MyOrder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JourneyPlan` ADD CONSTRAINT `JourneyPlan_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JourneyPlan` ADD CONSTRAINT `JourneyPlan_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JourneyPlan` ADD CONSTRAINT `JourneyPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_journeyPlanId_fkey` FOREIGN KEY (`journeyPlanId`) REFERENCES `JourneyPlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackReport` ADD CONSTRAINT `FeedbackReport_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackReport` ADD CONSTRAINT `FeedbackReport_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackReport` ADD CONSTRAINT `FeedbackReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReport` ADD CONSTRAINT `ProductReport_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReport` ADD CONSTRAINT `ProductReport_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReport` ADD CONSTRAINT `ProductReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VisibilityReport` ADD CONSTRAINT `VisibilityReport_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VisibilityReport` ADD CONSTRAINT `VisibilityReport_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VisibilityReport` ADD CONSTRAINT `VisibilityReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReturn` ADD CONSTRAINT `ProductReturn_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReturn` ADD CONSTRAINT `ProductReturn_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReturn` ADD CONSTRAINT `ProductReturn_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductsSample` ADD CONSTRAINT `ProductsSample_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductsSample` ADD CONSTRAINT `ProductsSample_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductsSample` ADD CONSTRAINT `ProductsSample_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReturnItem` ADD CONSTRAINT `ProductReturnItem_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReturnItem` ADD CONSTRAINT `ProductReturnItem_productReturnId_fkey` FOREIGN KEY (`productReturnId`) REFERENCES `ProductReturn`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductReturnItem` ADD CONSTRAINT `ProductReturnItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductsSampleItem` ADD CONSTRAINT `ProductsSampleItem_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductsSampleItem` ADD CONSTRAINT `ProductsSampleItem_productsSampleId_fkey` FOREIGN KEY (`productsSampleId`) REFERENCES `ProductsSample`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductsSampleItem` ADD CONSTRAINT `ProductsSampleItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leaves` ADD CONSTRAINT `leaves_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UpliftSale` ADD CONSTRAINT `UpliftSale_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UpliftSale` ADD CONSTRAINT `UpliftSale_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `UpliftSaleItem` ADD CONSTRAINT `UpliftSaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UpliftSaleItem` ADD CONSTRAINT `UpliftSaleItem_upliftSaleId_fkey` FOREIGN KEY (`upliftSaleId`) REFERENCES `UpliftSale`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierHistory` ADD CONSTRAINT `SupplierHistory_supplierId_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `Suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_salesRepId_fkey` FOREIGN KEY (`salesRepId`) REFERENCES `SalesRep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_transactions` ADD CONSTRAINT `product_transactions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Expenses` ADD CONSTRAINT `Expenses_ibfk_1` FOREIGN KEY (`expense_type_id`) REFERENCES `MyAccounts`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Expenses` ADD CONSTRAINT `Expenses_ibfk_2` FOREIGN KEY (`posted_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `_MyOrderToReport` ADD CONSTRAINT `_MyOrderToReport_A_fkey` FOREIGN KEY (`A`) REFERENCES `MyOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_MyOrderToReport` ADD CONSTRAINT `_MyOrderToReport_B_fkey` FOREIGN KEY (`B`) REFERENCES `Report`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
