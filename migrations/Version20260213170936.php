<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260213170936 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add team_position and opponent_champion_id to player_match for benchmarks/analysis';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player_match ADD team_position VARCHAR(20) DEFAULT NULL');
        $this->addSql('ALTER TABLE player_match ADD opponent_champion_id INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player_match DROP team_position');
        $this->addSql('ALTER TABLE player_match DROP opponent_champion_id');
    }
}
