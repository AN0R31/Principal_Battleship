<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20220907160652 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE battle (id INT AUTO_INCREMENT NOT NULL, user1_id INT NOT NULL, user2_id INT DEFAULT NULL, winner_id INT DEFAULT NULL, nr_ships INT NOT NULL, nr_shots INT NOT NULL, password VARCHAR(255) NOT NULL, user1_points INT DEFAULT NULL, user2_points INT DEFAULT NULL, INDEX IDX_1399173456AE248B (user1_id), INDEX IDX_13991734441B8B65 (user2_id), INDEX IDX_139917345DFCD4B8 (winner_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE battle ADD CONSTRAINT FK_1399173456AE248B FOREIGN KEY (user1_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE battle ADD CONSTRAINT FK_13991734441B8B65 FOREIGN KEY (user2_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE battle ADD CONSTRAINT FK_139917345DFCD4B8 FOREIGN KEY (winner_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE battle DROP FOREIGN KEY FK_1399173456AE248B');
        $this->addSql('ALTER TABLE battle DROP FOREIGN KEY FK_13991734441B8B65');
        $this->addSql('ALTER TABLE battle DROP FOREIGN KEY FK_139917345DFCD4B8');
        $this->addSql('DROP TABLE battle');
    }
}
