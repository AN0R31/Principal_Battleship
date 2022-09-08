<?php

namespace App\Controller;

use App\Entity\Battle;
use App\Service\CreateMatchServiceProvider;
use App\Service\JoinBattleServiceProvider;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class BattleController extends AbstractController
{
    #[Route('/battle', name: 'show_battle')]
    public function showBattle(Request $request): Response
    {
        if (!$this->getUser())
            return $this->redirectToRoute('app_login');
        
        return sizeof($request->query) === 2 ? $this->render('/battle/battle.html.twig') : $this->redirectToRoute('app_home');

    }

    #[Route('/battle/create', name: 'create_battle', methods: ['post'])]
    public function createBattle(Request $request, CreateMatchServiceProvider $service, EntityManagerInterface $entityManager): Response
    {
        $requestParameters = $request->request;

        $battle = new Battle();
        $battle->setNrShips($requestParameters->get('ships'));
        $battle->setNrShots($requestParameters->get('shots'));
        $battle->setUser1($this->getUser());
        $battle->setPassword($service->matchPassword());

        try {
            $entityManager->persist($battle);
            $entityManager->flush();
        } catch (\Exception $exception) {
            return new JsonResponse(['exception' => $exception]);
        }

        $battleId = $entityManager->getRepository(Battle::class)->findOneBy([
            'user1_id' => $this->getUser(),
            'password' => $battle->getPassword(),
        ])->getId();

        return new JsonResponse(['status' => true, 'battle_id' => $battleId, 'password' => $battle->getPassword()]);

    }

    #[Route('/battle/join', name: 'join_battle', methods: ['post'])]
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