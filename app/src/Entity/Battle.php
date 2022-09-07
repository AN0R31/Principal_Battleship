<?php

namespace App\Entity;

use App\Repository\BattleRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BattleRepository::class)]
class Battle
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?int $nr_ships = null;

    #[ORM\Column]
    private ?int $nr_shots = null;

    #[ORM\Column]
    private ?int $user1_id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'battle')]
    #[ORM\JoinColumn(name: 'user1_id', referencedColumnName: 'id', nullable: false)]
    private ?User $user1 = null;

    #[ORM\Column(nullable: true)]
    private ?int $user2_id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'battle')]
    #[ORM\JoinColumn(name: 'user2_id', referencedColumnName: 'id', nullable: false)]
    private ?User $user2 = null;

    #[ORM\Column(length: 255)]
    private ?string $password = null;

    #[ORM\Column(nullable: true)]
    private ?int $user1_points = null;

    #[ORM\Column(nullable: true)]
    private ?int $user2_points = null;

    #[ORM\Column(nullable: true)]
    private ?int $winner_id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'battle')]
    #[ORM\JoinColumn(name: 'winner_id', referencedColumnName: 'id', nullable: false)]
    private ?User $winner = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNrShips(): ?int
    {
        return $this->nr_ships;
    }

    public function setNrShips(int $nr_ships): self
    {
        $this->nr_ships = $nr_ships;

        return $this;
    }

    public function getNrShots(): ?int
    {
        return $this->nr_shots;
    }

    public function setNrShots(int $nr_shots): self
    {
        $this->nr_shots = $nr_shots;

        return $this;
    }

    public function getUser1Id(): ?int
    {
        return $this->user1_id;
    }

    public function setUser1Id(int $user1_id): self
    {
        $this->user1_id = $user1_id;

        return $this;
    }

    public function getUser2Id(): ?int
    {
        return $this->user2_id;
    }

    public function setUser2Id(int $user2_id): self
    {
        $this->user2_id = $user2_id;

        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): self
    {
        $this->password = $password;

        return $this;
    }

    public function getUser1Points(): ?int
    {
        return $this->user1_points;
    }

    public function setUser1Points(?int $user1_points): self
    {
        $this->user1_points = $user1_points;

        return $this;
    }

    public function getUser2Points(): ?int
    {
        return $this->user2_points;
    }

    public function setUser2Points(?int $user2_points): self
    {
        $this->user2_points = $user2_points;

        return $this;
    }

    /**
     * @return User|null
     */
    public function getUser1(): ?User
    {
        return $this->user1;
    }

    /**
     * @param User|null $user1
     */
    public function setUser1(?User $user1): void
    {
        $this->user1 = $user1;
    }

    /**
     * @return User|null
     */
    public function getUser2(): ?User
    {
        return $this->user2;
    }

    /**
     * @param User|null $user2
     */
    public function setUser2(?User $user2): void
    {
        $this->user2 = $user2;
    }

    public function getWinnerId(): ?int
    {
        return $this->winner_id;
    }

    public function setWinnerId(?int $winner_id): void
    {
        $this->winner_id = $winner_id;
    }

    public function getWinner(): ?User
    {
        return $this->winner;
    }

    public function setWinner(?User $winner): void
    {
        $this->winner = $winner;
    }

}
