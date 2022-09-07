<?php

namespace App\Service;

use Symfony\Component\Security\Core\Security;

class CreateMatchServiceProvider
{
    public function __construct(protected Security $security)
    {
    }

    public function matchPassword(): int
    {
        try {
            return random_int(100, 1000) * 10 + $this->security->getUser()->getId();
        } catch (\Exception $e) {
            return 123120 + $this->security->getUser()->getId();
        }
    }
}