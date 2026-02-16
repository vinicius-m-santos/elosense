<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260216180000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add profile_icon_id to players table.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE players ADD profile_icon_id INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE players DROP profile_icon_id');
    }
}
