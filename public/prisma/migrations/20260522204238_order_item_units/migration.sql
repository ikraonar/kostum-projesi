-- CreateTable
CREATE TABLE "OrderItemUnit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderItemId" INTEGER NOT NULL,
    "kod" TEXT NOT NULL,
    CONSTRAINT "OrderItemUnit_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderItemUnit_kod_key" ON "OrderItemUnit"("kod");
