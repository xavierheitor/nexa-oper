SET @add_texto_livre_sql = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'AtividadeAprRespostaMedidaControle'
              AND COLUMN_NAME = 'textoLivre'
        ),
        'SELECT 1',
        'ALTER TABLE `AtividadeAprRespostaMedidaControle` ADD COLUMN `textoLivre` TEXT NULL AFTER `medidaControleNomeSnapshot`'
    )
);
PREPARE add_texto_livre_stmt FROM @add_texto_livre_sql;
EXECUTE add_texto_livre_stmt;
DEALLOCATE PREPARE add_texto_livre_stmt;
