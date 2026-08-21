-- ============================================================
--  Processing_Dashboard Database Setup Script
--  For SSMS LocalDB: (localdb)\mssqllocaldb (Windows Authentication)
-- ============================================================

-- Step 1: Create the database (if it does not already exist)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Processing_Dashboard')
BEGIN
    CREATE DATABASE Processing_Dashboard;
    PRINT 'Database Processing_Dashboard created successfully.';
END
ELSE
    PRINT 'Database Processing_Dashboard already exists.';
GO

-- Step 2: Switch to the new database
USE Processing_Dashboard;
GO

-- Step 3: Create the POSubmissions table (if it does not already exist)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='POSubmissions' AND xtype='U')
BEGIN
    CREATE TABLE POSubmissions (
        id                  INT IDENTITY(1,1) PRIMARY KEY,
        sr_no               NVARCHAR(50)    NULL,
        po_no               NVARCHAR(100)   NOT NULL,
        product_description NVARCHAR(500)   NOT NULL,
        po_date             NVARCHAR(50)    NOT NULL,
        card_quantity       NVARCHAR(100)   NOT NULL,
        antenna_type        NVARCHAR(100)   NULL,
        perso_type          NVARCHAR(100)   NULL,
        module_make         NVARCHAR(200)   NULL,
        module_part_code    NVARCHAR(200)   NULL,
        chip_atr            NVARCHAR(200)   NULL,
        chip_ats            NVARCHAR(200)   NULL,
        module_qty_sent     NVARCHAR(100)   NULL,
        module_sent_date    NVARCHAR(50)    NULL,
        module_received_date NVARCHAR(50)   NULL,
        cdd                 NVARCHAR(50)    NULL,
        order_status        NVARCHAR(100)   NULL,
        submitted_at        DATETIME        DEFAULT GETDATE()
    );
    PRINT 'Table POSubmissions created successfully.';
END
ELSE
    PRINT 'Table POSubmissions already exists.';
GO

PRINT 'Processing_Dashboard setup complete!';
SELECT 'Database ready' AS Status, DB_NAME() AS CurrentDatabase, GETDATE() AS SetupTime;
