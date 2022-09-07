<?php

namespace App\Controller;

use App\Entity\Battle;
use App\Service\JoinBattleServiceProvider;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class JoinBattleController extends AbstractController
{
    #[Route('/joinBattle', name: 'join_battle', methods: ['post'])]
    public function joinBattle(Request $request, EntityManagerInterface $entityManager, JoinBattleServiceProvider $service): Response
    {
        $givenPassword = $request->request->get('password');
        $battle = $entityManager->getRepository(Battle::class)->findOneBy(['password' => $givenPassword]);

        if ($battle === null) {
            return new JsonResponse(['status' => false, 'message' => 'Battle KEY Invalid!']);
        }

        if ($service->isLoggedUserSameAsGiven($battle->getUser1())) {
            return new JsonResponse(['status' => false, 'message' => 'Cannot join your own Battle!']);
        }

        if ($givenPassword === $battle->getPassword()) {

            $battle->setUser2($this->getUser());

            $entityManager->persist($battle);
            $entityManager->flush();

            return new JsonResponse([
                'status' => true,
                'battle_id' => $battle->getId(),
            ]);
        }

        return new JsonResponse(['status' => false, 'message' => 'Something went wrong. Try Again!']);
    }
}