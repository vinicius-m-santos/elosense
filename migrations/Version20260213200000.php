<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260213200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add game_end_timestamp to player_match for ordering and time-ago display';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player_match ADD game_end_timestamp BIGINT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player_match DROP game_end_timestamp');
    }
}
