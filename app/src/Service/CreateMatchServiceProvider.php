<?php

namespace App\Service;

use Symfony\Component\Security\Core\Security;

class CreateMatchServiceProvider
{
    public function __construct(protected Security $security)
    {
    }

    public function matchPassword(): string
    {
        $userId = $this->security->getUser()->getId();

        try {
            return random_int(10000000, 100000000) . $userId;
        } catch (\Exception $e) {
            return 12233120 . $userId;
        }
    }
}