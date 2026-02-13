<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260213170934 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add queue_id to player_match';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player_match ADD queue_id INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player_match DROP queue_id');
    }
}
