-- Limpa tabelas legadas em snake_case que ficaram fora do schema atual.
-- Validado neste ambiente: todas estavam sem dados no momento da criacao desta migration.

DROP TABLE IF EXISTS `proj_estrutura`;
DROP TABLE IF EXISTS `proj_tipo_estrutura`;
DROP TABLE IF EXISTS `proj_tipo_poste`;
DROP TABLE IF EXISTS `proj_tipo_ramal`;
