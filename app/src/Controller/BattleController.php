<?php

namespace App\Controller;

use App\Entity\Battle;
use App\Service\CreateMatchService;
use App\Service\JoinBattleService;
use Doctrine\ORM\EntityManagerInterface;
use Pusher\Pusher;
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

        $user2Username = null;
        $user1Username = null;

        if ($battle->getUser2() === null) {
            $status = 'Waiting for opponent...';
        } else {
            $status = true;
            $user2Username = $battle->getUser2()->getUsername();
            $user1Username = $battle->getUser1()->getUsername();
        }

        return sizeof($request->query) === 2 ? $this->render('/battle/battle.html.twig', ['battle_id' => $request->query->get('battle_id'),'nrShips' => $nrShips, 'nrShots' => $nrShots, 'user1Username' => $user1Username, 'user2Username' => $user2Username, 'status' => $status]) : $this->redirectToRoute('app_home');

    }

    #[Route('/battle/create', name: 'create_battle', methods: ['post'])]
    public function createBattle(Request $request, CreateMatchService $service, EntityManagerInterface $entityManager): Response
    {
        $requestParameters = $request->request;

        $battleState = '{"hostBoard":{"boats":{},"hitsTaken":{}},"guestBoard":{"boats":{},"hitsTaken":{}}}';

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
    public function joinBattle(Request $request, EntityManagerInterface $entityManager, JoinBattleService $service): Response
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

    #[Route('/battle/load', name: 'load_battle', methods: ['post'])]
    public function load(Request $request, EntityManagerInterface $entityManager): Response
    {
        $requestParameters = $request->request;

        $nr = sizeof($requestParameters);

        $battle = $entityManager->getRepository(Battle::class)->findOneBy([
            //TODO: some unique identifier
            "winner_id" => null,
        ]);

        $battleState = $battle->getBattleState();

        $battleState = json_decode($battleState);

        $board = $this->getUser()->getId() === $battle->getUser1()->getId() ? 'hostBoard' : 'guestBoard';

        foreach ($requestParameters as $value) {
            $params = explode(',', $value);
            $battleState->{$board}->boats->{$nr} = new \stdClass();
            $battleState->{$board}->boats->{$nr}->coordinates = new \stdClass();
            $battleState->{$board}->boats->{$nr}->health = $params[1];
            $battleState->{$board}->boats->{$nr}->vertical = filter_var($params[2], FILTER_VALIDATE_BOOLEAN);
            $battleState->{$board}->boats->{$nr}->coordinates->posX = str_split($params[0])[1];
            $battleState->{$board}->boats->{$nr}->coordinates->posY = str_split($params[0])[0];
            $nr--;
        }

        $battleState = json_encode($battleState);
        $battle->setBattleState($battleState);
        $entityManager->persist($battle);
        $entityManager->flush();

        return new JsonResponse(['status' => true]);
    }

    #[Route('/battle/hit', name: 'hit', methods: ['post'])]
    public function hit(Pusher $pusher, Request $request, EntityManagerInterface $entityManager): Response
    {
        $coordinates = explode(" ", $request->request->get('hit'));

        $battle = $entityManager->getRepository(Battle::class)->findOneBy([
            //TODO: some unique identifier
            "winner_id" => null,
        ]);

        $battleState = json_decode($battle->getBattleState());

        $board = $this->getUser()->getId() === $battle->getUser1()->getId() ? 'guestBoard' : 'hostBoard';

        $nrOfHits = count(get_object_vars($battleState->{$board}->hitsTaken)) + 1;

        $battleState->{$board}->hitsTaken->{$nrOfHits} = new \stdClass();
        $battleState->{$board}->hitsTaken->{$nrOfHits}->posX = $coordinates[1];
        $battleState->{$board}->hitsTaken->{$nrOfHits}->posY = $coordinates[0];

        $battleState = json_encode($battleState);
        $battle->setBattleState($battleState);
        $entityManager->persist($battle);
        $entityManager->flush();

        $pusher->trigger($request->request->get('channel'), 'new-greeting', ['board' => $board, 'coordinates' => $coordinates]);
        return new JsonResponse(['status' => true]);
    }
}