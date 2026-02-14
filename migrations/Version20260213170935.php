<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260213170935 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Sample tables (sample_player, sample_match, sample_match_participant, elo_benchmark) for scraper and benchmarks';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sample_player (id SERIAL NOT NULL, puuid VARCHAR(78) NOT NULL, region VARCHAR(10) NOT NULL, tier VARCHAR(20) NOT NULL, rank VARCHAR(5) NOT NULL, queue_type VARCHAR(30) NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_sample_player_puuid_region ON sample_player (puuid, region)');

        $this->addSql('CREATE TABLE sample_match (id SERIAL NOT NULL, match_id VARCHAR(100) NOT NULL, region VARCHAR(10) NOT NULL, payload JSONB NOT NULL, game_creation BIGINT DEFAULT NULL, game_duration INT DEFAULT NULL, queue_id INT DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_sample_match_id_region ON sample_match (match_id, region)');

        $this->addSql('CREATE TABLE sample_match_participant (id SERIAL NOT NULL, match_id VARCHAR(100) NOT NULL, region VARCHAR(10) NOT NULL, puuid VARCHAR(78) NOT NULL, tier VARCHAR(20) DEFAULT NULL, rank VARCHAR(5) DEFAULT NULL, team_position VARCHAR(20) NOT NULL, champion_id INT NOT NULL, champion_name VARCHAR(100) NOT NULL, opponent_champion_id INT DEFAULT NULL, kills INT NOT NULL, deaths INT NOT NULL, assists INT NOT NULL, cs_per_min DOUBLE PRECISION NOT NULL, damage_per_min DOUBLE PRECISION NOT NULL, vision_score DOUBLE PRECISION NOT NULL, gold_per_min DOUBLE PRECISION DEFAULT NULL, kill_participation DOUBLE PRECISION DEFAULT NULL, win BOOLEAN NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_sample_participant_match_region_puuid ON sample_match_participant (match_id, region, puuid)');

        $this->addSql('CREATE TABLE elo_benchmark (id SERIAL NOT NULL, region VARCHAR(10) NOT NULL, queue_id INT NOT NULL, tier VARCHAR(20) NOT NULL, rank VARCHAR(5) NOT NULL, team_position VARCHAR(20) NOT NULL, champion_id INT DEFAULT NULL, opponent_champion_id INT DEFAULT NULL, sample_size INT NOT NULL, cs_per_min_avg DOUBLE PRECISION DEFAULT NULL, cs_per_min_p50 DOUBLE PRECISION DEFAULT NULL, cs_per_min_p75 DOUBLE PRECISION DEFAULT NULL, damage_per_min_avg DOUBLE PRECISION DEFAULT NULL, damage_per_min_p50 DOUBLE PRECISION DEFAULT NULL, damage_per_min_p75 DOUBLE PRECISION DEFAULT NULL, vision_score_avg DOUBLE PRECISION DEFAULT NULL, vision_score_p50 DOUBLE PRECISION DEFAULT NULL, vision_score_p75 DOUBLE PRECISION DEFAULT NULL, gold_per_min_avg DOUBLE PRECISION DEFAULT NULL, gold_per_min_p50 DOUBLE PRECISION DEFAULT NULL, gold_per_min_p75 DOUBLE PRECISION DEFAULT NULL, kill_participation_avg DOUBLE PRECISION DEFAULT NULL, kill_participation_p50 DOUBLE PRECISION DEFAULT NULL, kill_participation_p75 DOUBLE PRECISION DEFAULT NULL, deaths_avg DOUBLE PRECISION DEFAULT NULL, deaths_p50 DOUBLE PRECISION DEFAULT NULL, deaths_p75 DOUBLE PRECISION DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_elo_benchmark_lookup ON elo_benchmark (region, queue_id, tier, rank, team_position, champion_id, opponent_champion_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE elo_benchmark');
        $this->addSql('DROP TABLE sample_match_participant');
        $this->addSql('DROP TABLE sample_match');
        $this->addSql('DROP TABLE sample_player');
    }
}
