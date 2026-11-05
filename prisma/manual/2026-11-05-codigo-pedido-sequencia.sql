-- Código visível do pedido "6700-MP" (aditivo; nenhum dado existente é alterado).
-- Coluna criada SEM default primeiro: os 60 pedidos antigos ficam com NULL e mantêm o código antigo.
CREATE SEQUENCE IF NOT EXISTS "Pedido_codigoNumero_seq" AS INTEGER START WITH 6700 MINVALUE 6700 NO CYCLE;
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "codigoNumero" INTEGER;
ALTER TABLE "Pedido" ALTER COLUMN "codigoNumero" SET DEFAULT nextval('"Pedido_codigoNumero_seq"'::regclass);
ALTER SEQUENCE "Pedido_codigoNumero_seq" OWNED BY "Pedido"."codigoNumero";
CREATE UNIQUE INDEX IF NOT EXISTS "Pedido_codigoNumero_key" ON "Pedido"("codigoNumero");
