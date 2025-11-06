-- Schema para MySQL (importar no MySQL Workbench)
-- Ajuste o nome do database conforme necessário
CREATE DATABASE IF NOT EXISTS `tech_trade` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tech_trade`;

CREATE TABLE IF NOT EXISTS `produto` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `image` VARCHAR(255),
  `old_price` DECIMAL(10,2),
  `price` DECIMAL(10,2),
  `location` VARCHAR(255),
  `installments` VARCHAR(50),
  `stock` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
