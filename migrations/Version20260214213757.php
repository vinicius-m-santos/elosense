<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260214213757 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE plan (id SERIAL NOT NULL, code VARCHAR(50) NOT NULL, name VARCHAR(100) NOT NULL, capabilities JSON NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_DD5A5B7D77153098 ON plan (code)');
        $this->addSql('CREATE TABLE "refresh_tokens" (id SERIAL NOT NULL, refresh_token VARCHAR(128) NOT NULL, username VARCHAR(255) NOT NULL, valid TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_9BACE7E1C74F2195 ON "refresh_tokens" (refresh_token)');
        $this->addSql('CREATE TABLE subscription (id SERIAL NOT NULL, plan_id INT NOT NULL, status VARCHAR(20) NOT NULL, started_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, ends_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_A3C664D3E899029B ON subscription (plan_id)');
        $this->addSql('COMMENT ON COLUMN subscription.started_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN subscription.ends_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE users (id SERIAL NOT NULL, uuid UUID NOT NULL, email VARCHAR(255) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) DEFAULT NULL, google_id VARCHAR(255) DEFAULT NULL, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, avatar_key VARCHAR(255) DEFAULT NULL, avatar_url TEXT DEFAULT NULL, phone VARCHAR(50) DEFAULT NULL, birth_date DATE DEFAULT NULL, gender VARCHAR(1) DEFAULT NULL, active BOOLEAN DEFAULT true NOT NULL, deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, email_notifications BOOLEAN DEFAULT true NOT NULL, app_notifications BOOLEAN DEFAULT true NOT NULL, is_verified BOOLEAN DEFAULT false NOT NULL, verification_token VARCHAR(255) DEFAULT NULL, reset_token VARCHAR(255) DEFAULT NULL, reset_token_expires_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E9D17F50A6 ON users (uuid)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E9E7927C74 ON users (email)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1483A5E976F5C865 ON users (google_id)');
        $this->addSql('COMMENT ON COLUMN users.uuid IS \'(DC2Type:uuid)\'');
        $this->addSql('COMMENT ON COLUMN users.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN users.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN users.birth_date IS \'(DC2Type:date_immutable)\'');
        $this->addSql('COMMENT ON COLUMN users.deleted_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN users.reset_token_expires_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE subscription ADD CONSTRAINT FK_A3C664D3E899029B FOREIGN KEY (plan_id) REFERENCES plan (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE elo_benchmark ALTER updated_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN elo_benchmark.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER INDEX idx_player_match_puuid RENAME TO IDX_C529BE43CFCB9868');
        $this->addSql('ALTER TABLE sample_match ALTER created_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN sample_match.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE sample_player ALTER updated_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN sample_player.updated_at IS \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE subscription DROP CONSTRAINT FK_A3C664D3E899029B');
        $this->addSql('DROP TABLE plan');
        $this->addSql('DROP TABLE "refresh_tokens"');
        $this->addSql('DROP TABLE subscription');
        $this->addSql('DROP TABLE users');
        $this->addSql('ALTER TABLE sample_match ALTER created_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN sample_match.created_at IS NULL');
        $this->addSql('ALTER TABLE elo_benchmark ALTER updated_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN elo_benchmark.updated_at IS NULL');
        $this->addSql('ALTER INDEX idx_c529be43cfcb9868 RENAME TO idx_player_match_puuid');
        $this->addSql('ALTER TABLE sample_player ALTER updated_at TYPE TIMESTAMP(0) WITHOUT TIME ZONE');
        $this->addSql('COMMENT ON COLUMN sample_player.updated_at IS NULL');
    }
}
