<?php

namespace App\Service;

use Symfony\Component\Security\Core\Security;

class CreateMatchService
{
    public function __construct(protected Security $security)
    {
    }

    public function matchPassword(): string
    {
        $userId = $this->security->getUser()->getId();

            return hrtime(true) . $userId;

    }
}