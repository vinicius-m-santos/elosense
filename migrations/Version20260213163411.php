<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260213163411 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create players and player_match tables for LoL dashboard';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE players (puuid VARCHAR(78) NOT NULL, name VARCHAR(255) NOT NULL, tag VARCHAR(20) NOT NULL, PRIMARY KEY(puuid))');
        $this->addSql('CREATE TABLE player_match (id SERIAL NOT NULL, match_id VARCHAR(100) NOT NULL, puuid VARCHAR(78) NOT NULL, champion VARCHAR(100) NOT NULL, champion_id INT NOT NULL, result BOOLEAN NOT NULL, kda VARCHAR(50) NOT NULL, cs_per_min DOUBLE PRECISION NOT NULL, damage_per_min DOUBLE PRECISION NOT NULL, vision_score DOUBLE PRECISION NOT NULL, deaths INT NOT NULL, early_deaths INT NOT NULL, solo_deaths INT NOT NULL, kill_participation DOUBLE PRECISION DEFAULT NULL, gold_per_min DOUBLE PRECISION DEFAULT NULL, score VARCHAR(5) NOT NULL, game_duration INT DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_player_match_puuid ON player_match (match_id, puuid)');
        $this->addSql('CREATE INDEX IDX_player_match_puuid ON player_match (puuid)');
        $this->addSql('ALTER TABLE player_match ADD CONSTRAINT FK_player_match_players_puuid FOREIGN KEY (puuid) REFERENCES players (puuid) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player_match DROP CONSTRAINT FK_player_match_players_puuid');
        $this->addSql('DROP TABLE player_match');
        $this->addSql('DROP TABLE players');
    }
}
