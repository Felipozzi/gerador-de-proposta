-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT,
    "bairro" TEXT NOT NULL,
    "indicacao" TEXT,
    "moradores" INTEGER NOT NULL,
    "criancas" BOOLEAN NOT NULL,
    "idosos" BOOLEAN NOT NULL,
    "animais" BOOLEAN,
    "servico" TEXT NOT NULL,
    "dias" INTEGER NOT NULL,
    "estilo" TEXT NOT NULL,
    "restricoes" TEXT,
    "preferencias" TEXT,
    "rejeicoes" TEXT,
    "freezer" TEXT NOT NULL,
    "compras" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "entrega" TEXT NOT NULL,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "etapa1" TEXT,
    "etapa2" TEXT,
    "etapa3" TEXT,
    "etapa4" TEXT,
    "etapa5" TEXT,
    "etapa6" TEXT,
    "etapa7" TEXT,
    "etapa8" TEXT,
    "etapa9" TEXT,
    "etapa10" TEXT,
    "precificacao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Proposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "servico" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "unidade" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingConfig_servico_key" ON "PricingConfig"("servico");

