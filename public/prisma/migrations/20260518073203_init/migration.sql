-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adSoyad" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sifre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'user'
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ad" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Costume" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ad" TEXT NOT NULL,
    "kategoriId" INTEGER NOT NULL,
    "beden" TEXT NOT NULL,
    "fiyat" REAL NOT NULL,
    "stok" INTEGER NOT NULL,
    "gorsel" TEXT,
    CONSTRAINT "Costume_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "toplamFiyat" REAL NOT NULL,
    "baslangic" DATETIME NOT NULL,
    "bitis" DATETIME NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'beklemede',
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "costumeId" INTEGER NOT NULL,
    "adet" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_costumeId_fkey" FOREIGN KEY ("costumeId") REFERENCES "Costume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
