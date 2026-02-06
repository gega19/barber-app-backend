-- CreateIndex: teléfono único (no se puede repetir entre usuarios; varios pueden tener NULL)
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
