-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema gimme_food
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema gimme_food
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `gimme_food` DEFAULT CHARACTER SET utf8 ;
USE `gimme_food` ;

-- -----------------------------------------------------
-- Table `gimme_food`.`categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `gimme_food`.`categories` (
  `category_id` VARCHAR(30) NOT NULL,
  `category_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`category_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `gimme_food`.`item_price`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `gimme_food`.`item_price` (
  `item_free` TINYINT NOT NULL,
  `item_price` DECIMAL NOT NULL,
  `item_id` INT NULL,
  PRIMARY KEY (`item_price`),
  INDEX `item_id_idx` (`item_id` ASC) VISIBLE,
  CONSTRAINT `item_id`
    FOREIGN KEY (`item_id`)
    REFERENCES `gimme_food`.`menu_item` (`item_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `gimme_food`.`seller`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `gimme_food`.`seller` (
  `seller_id` VARCHAR(45) NULL,
  `username` VARCHAR(16) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(32) NOT NULL,
  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `store_id` INT NULL AUTO_INCREMENT,
  `seller_city` VARCHAR(45) NOT NULL,
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE,
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE,
  UNIQUE INDEX `seller_id_UNIQUE` (`seller_id` ASC) VISIBLE,
  UNIQUE INDEX `store_id_UNIQUE` (`store_id` ASC) VISIBLE);


-- -----------------------------------------------------
-- Table `gimme_food`.`stores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `gimme_food`.`stores` (
  `store_name` VARCHAR(50) NOT NULL,
  `store_open` TINYINT NOT NULL,
  `store_has_items` TINYINT NOT NULL,
  `store_id` INT NULL AUTO_INCREMENT,
  `seller_id` INT NOT NULL,
  `store_address` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`store_id`, `store_name`),
  UNIQUE INDEX `store_id_UNIQUE` (`store_id` ASC) VISIBLE,
  INDEX `seller_id_idx` (`seller_id` ASC) VISIBLE,
  CONSTRAINT `store_id`
    FOREIGN KEY (`store_id`)
    REFERENCES `gimme_food`.`seller` (`store_id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `seller_id`
    FOREIGN KEY (`seller_id`)
    REFERENCES `gimme_food`.`seller` (`seller_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `gimme_food`.`menu_item`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `gimme_food`.`menu_item` (
  `item_id` INT NOT NULL,
  `item_name` VARCHAR(80) NOT NULL,
  `item_price` FLOAT NOT NULL,
  `item_stock` TINYINT NOT NULL,
  `item_category` VARCHAR(45) NOT NULL,
  `item_expiry_date` DATE NOT NULL,
  `item_produce_time` DATE NULL,
  `item_quantity` INT NOT NULL,
  `store_id` INT NOT NULL,
  PRIMARY KEY (`item_id`, `store_id`),
  INDEX `category_name_idx` (`item_category` ASC) VISIBLE,
  INDEX `item_price_idx` (`item_price` ASC) VISIBLE,
  INDEX `store_id_idx` (`store_id` ASC) VISIBLE,
  CONSTRAINT `category_name`
    FOREIGN KEY (`item_category`)
    REFERENCES `gimme_food`.`categories` (`category_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `item_price`
    FOREIGN KEY (`item_price`)
    REFERENCES `gimme_food`.`item_price` (`item_price`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `store_id`
    FOREIGN KEY (`store_id`)
    REFERENCES `gimme_food`.`stores` (`store_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `gimme_food`.`food_request`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `gimme_food`.`food_request` (
  `request_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `status` ENUM('pending', 'accepted', 'rejected') NOT NULL,
  `requested_at` DATE GENERATED ALWAYS AS () VIRTUAL,
  `updated_at` DATE GENERATED ALWAYS AS () VIRTUAL,
  PRIMARY KEY (`request_id`),
  INDEX `user_id_idx` (`user_id` ASC) VISIBLE,
  INDEX `item_id_idx` (`item_id` ASC) VISIBLE,
  CONSTRAINT `user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `gimme_food`.`user` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `item_id`
    FOREIGN KEY (`item_id`)
    REFERENCES `gimme_food`.`menu_item` (`item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `gimme_food`.`user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `gimme_food`.`user` (
  `user_id` INT NULL AUTO_INCREMENT,
  `username` VARCHAR(16) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(32) NOT NULL,
  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `user_city` VARCHAR(45) NOT NULL,
  `user_address` VARCHAR(120) NULL,
  `request_id` INT NULL,
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE,
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC) VISIBLE,
  INDEX `request_id_idx` (`request_id` ASC) VISIBLE,
  CONSTRAINT `request_id`
    FOREIGN KEY (`request_id`)
    REFERENCES `gimme_food`.`food_request` (`request_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);


-- -----------------------------------------------------
-- Table `gimme_food`.`item_ingridients`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `gimme_food`.`item_ingridients` (
  `item_id` INT NOT NULL,
  `item_ingridients` VARCHAR(45) NOT NULL,
  `item_calories` VARCHAR(45) NOT NULL,
  `item_sugar` VARCHAR(45) NOT NULL,
  `item_carbohydrates` VARCHAR(45) NOT NULL,
  `item_protein` VARCHAR(45) NOT NULL,
  `item_weight` VARCHAR(45) NULL,
  `item_fat` VARCHAR(45) NOT NULL,
  `item_salt` VARCHAR(45) NOT NULL,
  `item_saturated fat` VARCHAR(45) NOT NULL,
  `item_vegan` TINYINT NOT NULL,
  `tem_glutenfree` TINYINT NOT NULL,
  `item_dairyfree` TINYINT NOT NULL,
  `item_has_alcohol` TINYINT NOT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `item_id`
    FOREIGN KEY (`item_id`)
    REFERENCES `gimme_food`.`menu_item` (`item_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE USER 'user1';


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
