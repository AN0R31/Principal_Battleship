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
    public function showBattle(Request $request, EntityManagerInterface $entityManager): Response
    {
        if (!$this->getUser())
            return $this->redirectToRoute('app_login');

        $battle = $entityManager->getRepository(Battle::class)->findOneBy(['id' => $request->query->get('battle_id')]);

        $nrShips = $battle->getNrShips();
        $nrShots = $battle->getNrShots();

        return sizeof($request->query) === 2 ? $this->render('/battle/battle.html.twig', ['nrShips' => $nrShips, 'nrShots' => $nrShots]) : $this->redirectToRoute('app_home');

    }

    #[Route('/battle/create', name: 'create_battle', methods: ['post'])]
    public function createBattle(Request $request, CreateMatchServiceProvider $service, EntityManagerInterface $entityManager): Response
    {
        $requestParameters = $request->request;

        $battleState = '{"hostBoard":{"boats":{}},"guestBoard":{"boats":{}},"hits":{"host":{"coordinates":[]},"guest":{"coordinates":[]}}}';

        $battle = new Battle();
        $battle->setNrShips($requestParameters->get('ships'));
        $battle->setNrShots($requestParameters->get('shots'));
        $battle->setUser1($this->getUser());
        $battle->setPassword($service->matchPassword());
        $battle->setBattleState($battleState);

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

    #[Route('/battle/load', name: 'join_battle', methods: ['post'])]
    public function load(Request $request, EntityManagerInterface $entityManager)
    {
        $requestParameters = $request->request;

        $nr = sizeof($requestParameters);

        $battle = $entityManager->getRepository(Battle::class)->findOneBy([
            "user1_id" => $this->getUser(),
            "winner_id" => null,
        ]);

        $battleState = $battle->getBattleState();

        $battleState = json_decode($battleState);

        foreach ($requestParameters as $key => $value) {
            $arrayOfXY = explode("_", $key);
            $battleState->hostBoard->boats->{$nr} = new \stdClass();
            $battleState->hostBoard->boats->{$nr}->coordinates = new \stdClass();
            $battleState->hostBoard->boats->{$nr}->coordinates->posX = $arrayOfXY[1];
            $battleState->hostBoard->boats->{$nr}->coordinates->posY = $arrayOfXY[0];
            $nr--;
        }

        $battleState = json_encode($battleState);
        $battle->setBattleState($battleState);
        $entityManager->persist($battle);
        $entityManager->flush();

        return new JsonResponse(['status' => true]);
    }
}