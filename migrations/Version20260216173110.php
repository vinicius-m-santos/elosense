<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260216173110 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add player_queue_ranks table for storing rank data per queue (One-to-Many from Player).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE player_queue_ranks (id SERIAL NOT NULL, player_puuid VARCHAR(78) NOT NULL, region VARCHAR(10) NOT NULL, tier VARCHAR(20) NOT NULL, rank VARCHAR(5) NOT NULL, queue_type VARCHAR(30) NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_C7AA4EE070B9E32E ON player_queue_ranks (player_puuid)');
        $this->addSql('ALTER TABLE player_queue_ranks ADD CONSTRAINT FK_C7AA4EE070B9E32E FOREIGN KEY (player_puuid) REFERENCES players (puuid) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE player_queue_ranks DROP CONSTRAINT FK_C7AA4EE070B9E32E');
        $this->addSql('DROP TABLE player_queue_ranks');
    }
}
