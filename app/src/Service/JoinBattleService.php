<?php

namespace App\Service;

use App\Entity\User;
use Symfony\Component\Security\Core\Security;

class JoinBattleService
{
    public function __construct(protected Security $security)
    {
    }

    public function isLoggedUserSameAsGiven(User $user): bool
    {
        return ($this->security->getUser()->getId() === $user->getId());
    }
}