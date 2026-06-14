CREATE DATABASE  IF NOT EXISTS `steelmart`;

USE `steelmart`;

CREATE TABLE IF NOT EXISTS `companies` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `company_name` varchar(150) NOT NULL,
  `website` varchar(255) NOT NULL,
  `office_number` varchar(20) NOT NULL,
  `company_type` enum('steelmart','generalContractor','vendor') DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `address` text,
  `status` enum('active','inactive','deleted','blocked') NOT NULL DEFAULT 'active',
  `is_temp` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `website` (`website`),
  UNIQUE KEY `office_number` (`office_number`),
  KEY `idx_company_status` (`status`)
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `employees` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARy KEY,
  `company_id` bigint unsigned DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) UNIQUE NOT NULL,
  `phone` varchar(20) UNIQUE NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `is_password_changed` tinyint(1) NOT NULL DEFAULT '0',
  `date_of_birth` date DEFAULT NULL,
  `address` text,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `role` enum('admin','teamLead','projectLead','legalTeam','employee') DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `status` enum('active','inactive','deleted','blocked') NOT NULL DEFAULT 'active',
  `tag` enum('detailing','engineering','design','dockersAndJoist','welding','erection','structural','cnc') DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `joined_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_employee_created_by` (`created_by`),
  KEY `idx_employee_status` (`status`),
  KEY `fk_employee_company` (`company_id`),
  KEY `fk_employee_updated_by` (`updated_by`),
  CONSTRAINT `fk_employee_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_employee_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_employee_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(255) UNIQUE NOT NULL,
  `otp` varchar(255) DEFAULT NULL,
  `expiry` bigint DEFAULT NULL,
  `attempts` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_password_resets_email` (`email`),
  KEY `idx_password_resets_expiry` (`expiry`)
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `bid_sales_id` varchar(100) DEFAULT NULL,
  `bid_crm_id` varchar(100) DEFAULT NULL,
  `bid_project_id` varchar(100) DEFAULT NULL,
  `project_name` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `due_date` date NOT NULL,
  `drawing_date` date NOT NULL,
  `drawing_description` text,
  `db_wage_rate` tinyint(1) NOT NULL DEFAULT '0',
  `tax_exempt` tinyint(1) NOT NULL DEFAULT '0',
  `fringes_amount` decimal(12,2) DEFAULT NULL,
  `base_contact_amount` decimal(12,2) DEFAULT NULL,
  `award_number` decimal(12,2) DEFAULT NULL,
  `overhead` decimal(10,2) DEFAULT NULL,
  `profit` decimal(10,2) DEFAULT NULL,
  `last_follow_up_date` timestamp NULL DEFAULT NULL,
  `send_to_company_ids` varchar(500) DEFAULT NULL,
  `approved_by` varchar(500) DEFAULT NULL,
  `scope_of_work` text,
  `exclusion` text,
  `access_notes` text,
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `bid_status` enum('bidInProgress','sentToClient','approved','lost','won','pendingApproval','notBidding','declined','deleted') NOT NULL DEFAULT 'bidInProgress',
  `project_status` enum('active','deleted','archived','completed') DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_bid_status_due_date` (`bid_status`,`due_date`),
  KEY `idx_project_status` (`project_status`),
  KEY `idx_project_created_by` (`created_by`),
  KEY `idx_project_updated_by` (`updated_by`),
  CONSTRAINT `fk_project_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_company_employees` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `company_employee_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_project_company_employee` (`project_id`,`company_employee_id`),
  KEY `idx_project_company_employee` (`company_employee_id`),
  CONSTRAINT `fk_project_company_employee` FOREIGN KEY (`company_employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_company_employee_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_folders` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `folder_name` varchar(255) NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_project_folder` (`project_id`,`parent_id`,`folder_name`),
  KEY `fk_project_folder_parent` (`parent_id`),
  KEY `fk_project_folder_creator` (`created_by`),
  KEY `fk_project_folder_updater` (`updated_by`),
  CONSTRAINT `fk_project_folder_creator` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_project_folder_parent` FOREIGN KEY (`parent_id`) REFERENCES `project_folders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_folder_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_folder_updater` FOREIGN KEY (`updated_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_files` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_folder_id` bigint unsigned NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` bigint unsigned DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_file_in_folder` (`project_folder_id`,`file_name`),
  KEY `idx_project_file_folder` (`project_folder_id`),
  KEY `idx_project_file_creator` (`created_by`),
  KEY `idx_project_file_updater` (`updated_by`),
  CONSTRAINT `fk_project_file_creator` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_project_file_folder` FOREIGN KEY (`project_folder_id`) REFERENCES `project_folders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_file_updater` FOREIGN KEY (`updated_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_gallery` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_project` (`project_id`),
  CONSTRAINT `fk_gallery_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_gallery_photos` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_gallery_id` bigint unsigned NOT NULL,
  `image_url` text NOT NULL,
  `gallery_status` enum('active','deleted','archived') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `title` varchar(255) DEFAULT NULL,
  `notes` text,
  KEY `idx_gallery_photo` (`project_gallery_id`),
  CONSTRAINT `fk_gallery_photo` FOREIGN KEY (`project_gallery_id`) REFERENCES `project_gallery` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_gallery_tags` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_gallery_id` bigint unsigned NOT NULL,
  `tag` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_gallery_tag` (`project_gallery_id`,`tag`),
  KEY `idx_gallery_tags` (`project_gallery_id`),
  CONSTRAINT `fk_tags_gallery` FOREIGN KEY (`project_gallery_id`) REFERENCES `project_gallery` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_invoices` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `sub_total` decimal(12,2) DEFAULT NULL,
  `grand_total` decimal(12,2) NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_project_invoice` (`project_id`),
  KEY `fk_project_invoice_created_by` (`created_by`),
  KEY `fk_project_invoice_updated_by` (`updated_by`),
  CONSTRAINT `fk_project_invoice_created_by` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_invoice_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_invoice_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_invoice_items` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_invoice_id` bigint unsigned NOT NULL,
  `item` varchar(255) NOT NULL,
  `description` text,
  `quantity` bigint unsigned NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `price` decimal(12,2) GENERATED ALWAYS AS ((`quantity` * `rate`)) STORED,
  `created_by` bigint unsigned NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_project_invoice_item` (`project_invoice_id`,`item`),
  KEY `idx_project_invoice_item_invoice` (`project_invoice_id`),
  KEY `idx_project_invoice_item_created_by` (`created_by`),
  KEY `idx_project_invoice_item_updated_by` (`updated_by`),
  CONSTRAINT `fk_project_invoice_item_creator` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_project_invoice_item_invoice` FOREIGN KEY (`project_invoice_id`) REFERENCES `project_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_invoice_item_updater` FOREIGN KEY (`updated_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_rfis` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `sr_no` int unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `notes` text,
  `description` text,
  `status` enum('draft','open','submitted','under_review','responded','closed') DEFAULT 'open',
  `priority` enum('Low','Medium','High') DEFAULT 'Medium',
  `ball_in_court` varchar(255) DEFAULT NULL,
  `is_escalated` tinyint(1) DEFAULT '0',
  `escalation_reason` varchar(500) DEFAULT NULL,
  `escalated_by` int DEFAULT NULL,
  `escalation_date` timestamp NULL DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_rfi_project` (`project_id`),
  CONSTRAINT `fk_rfi_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_rfi_history` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `rfi_id` bigint unsigned NOT NULL,
  `message` text NOT NULL,
  `file_url` text,
  `file_name` varchar(255) DEFAULT NULL,
  `is_reply_only` tinyint(1) DEFAULT '0',
  `response_status` enum('awaiting_response','responded','closed') DEFAULT 'awaiting_response',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_history_rfi` (`rfi_id`),
  CONSTRAINT `fk_history_rfi` FOREIGN KEY (`rfi_id`) REFERENCES `project_rfis` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_submittals` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `description` text,
  `status` enum('draft','open','submitted','under_review','responded','approved','rejected','closed','need_revision') DEFAULT 'open',
  `priority` enum('Low','Medium','High') DEFAULT 'Medium',
  `ball_in_court` varchar(255) DEFAULT NULL,
  `revision_count` int DEFAULT '0',
  `last_revised_by` int DEFAULT NULL,
  `last_revision_date` timestamp NULL DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_submittal_project` (`project_id`),
  CONSTRAINT `fk_submittal_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_submittal_versions` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `submittal_id` bigint unsigned NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `version` int unsigned NOT NULL DEFAULT '1',
  `message` text NOT NULL,
  `status` enum('draft','open','submitted','under_review','responded','approved','rejected','closed','need_revision') DEFAULT 'open',
  `approval_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approval_date` timestamp NULL DEFAULT NULL,
  `file_url` text,
  `file_name` varchar(255) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_version_submittal` (`submittal_id`),
  KEY `idx_version_parent` (`parent_id`),
  CONSTRAINT `fk_version_parent` FOREIGN KEY (`parent_id`) REFERENCES `project_submittal_versions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_version_submittal` FOREIGN KEY (`submittal_id`) REFERENCES `project_submittals` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `personnel_teams` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `company_id` bigint unsigned DEFAULT NULL,
  `team_name` varchar(255) NOT NULL,
  `team_type` enum('steelmart','generalContractor','vendor') NOT NULL DEFAULT 'generalContractor',
  `created_by` bigint unsigned NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `fk_personnel_team` (`project_id`),
  KEY `fk_personnel_team_company` (`company_id`),
  KEY `fk_personnel_team_creator` (`created_by`),
  KEY `fk_personnel_team_updater` (`updated_by`),
  CONSTRAINT `fk_personnel_team` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_personnel_team_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_personnel_team_creator` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_personnel_team_updater` FOREIGN KEY (`updated_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `personnel_team_employees` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `personnel_team_id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_personnel_team_member` (`personnel_team_id`,`employee_id`),
  KEY `fk_personnel_team_employee` (`employee_id`),
  CONSTRAINT `fk_personnel_team_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_personnel_team_team` FOREIGN KEY (`personnel_team_id`) REFERENCES `personnel_teams` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_vendors` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `vendor_company_id` bigint unsigned NOT NULL,
  `status` enum('invited','proposal_sent','approved','rejected','not_bidding') NOT NULL DEFAULT 'invited',
  `proposal_price` decimal(12,2) DEFAULT NULL,
  `proposal_lead_time` varchar(100) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `rejected_reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `proposal_documents` text,
  UNIQUE KEY `unique_project_vendor` (`project_id`,`vendor_company_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_vendor_company_id` (`vendor_company_id`)
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_financials` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned UNIQUE NOT NULL,
  `labour_cost` decimal(12,2) DEFAULT '0.00',
  `material_cost` decimal(12,2) DEFAULT '0.00',
  `vendor_cost` decimal(12,2) DEFAULT '0.00',
  `overhead_cost_percent` decimal(5,2) DEFAULT '0.00',
  `estimated_profit` decimal(12,2) DEFAULT '0.00',
  `payment_received` decimal(12,2) DEFAULT '0.00',
  `balance_remaining` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_financials_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_payments` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `vendor_name` varchar(255) NOT NULL,
  `amount` decimal(12,2) DEFAULT '0.00',
  `date` date DEFAULT NULL,
  `note` text,
  `invoice_file_url` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `fk_payments_project` (`project_id`),
  CONSTRAINT `fk_payments_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_change_orders` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `number` varchar(100) NOT NULL,
  `status` enum('Approved','Rejected','Open') DEFAULT 'Open',
  `amount` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `fk_change_orders_project` (`project_id`),
  CONSTRAINT `fk_change_orders_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;

CREATE TABLE IF NOT EXISTS `project_compliance_documents` (
  `id` bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  `project_id` bigint unsigned NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `type` enum('coi','general') DEFAULT 'general',
  `uploaded_by` varchar(255) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `status` enum('Approved','File Received','Certificate Expired','Rejected') DEFAULT 'File Received',
  `file_url` text ,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `fk_compliance_project` (`project_id`),
  CONSTRAINT `fk_compliance_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=`InnoDB` DEFAULT CHARSET=`utf8mb4` COLLATE=`utf8mb4_unicode_ci`;
