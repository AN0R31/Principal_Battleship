<?php

namespace App\Controller;

use App\Entity\Battle;
use App\Service\CreateMatchService;
use App\Service\JoinBattleService;
use Doctrine\ORM\EntityManagerInterface;
use Exception;
use Pusher\Pusher;
use stdClass;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class BattleController extends AbstractController
{
    #[Route('/battle', name: 'show_battle')]
    public function showBattle(Request $request, EntityManagerInterface $entityManager, JoinBattleService $service): Response
    {
        if (!$this->getUser())
            return $this->redirectToRoute('app_login');

        $battle = $entityManager->getRepository(Battle::class)->findOneBy(['id' => $request->query->get('battle_id')]);

        $nrShips = $battle->getNrShips();
        $nrShots = $battle->getNrShots();

        $user2Username = null;
        $user1Username = null;

        $status = false;
        $isUserSpectator = false;

        $board = $this->getUser()->getId() === $battle->getUser1()->getId() ? 'hostBoard' : 'guestBoard';

        $battleState = $battle->getBattleState();
        $battleState = json_decode($battleState);

        $haveBoatsBeenSet = (int)isset($battleState->{$board}->boats->{1});

        if ($battle->getUser2() === null) {
            $status = 'Waiting for opponent...';
        } else if (!$service->isLoggedUserSameAsGiven($battle->getUser1()) && !$service->isLoggedUserSameAsGiven($battle->getUser2())) {
            $isUserSpectator = true;
            $user2Username = $battle->getUser2()->getUsername();
            $user1Username = $battle->getUser1()->getUsername();
        } else {
            $status = true;
            $user2Username = $battle->getUser2()->getUsername();
            $user1Username = $battle->getUser1()->getUsername();
        }

        $boatSizes = null;
        if ($nrShips === 3) {
            $boatSizes = [2, 3, 5];
        } else if ($nrShips === 5) {
            $boatSizes = [2, 3, 3, 4, 5];
        } else if ($nrShips === 7) {
            $boatSizes = [2, 3, 3, 3, 4, 5, 5];
        }
        $battleState = json_decode($battle->getBattleState(), true);

        $board = $this->getUser()->getId() === $battle->getUser1()->getId() ? 'hostBoard' : 'guestBoard';
        $otherBoard = $board === 'hostBoard' ? 'guestBoard' : 'hostBoard';

        return sizeof($request->query) === 2 ? $this->render('/battle/battle.html.twig', [
            'battle_id' => $request->query->get('battle_id'),
            'isHost' => $this->getUser()->getId() === $battle->getUser1()->getId() ? 1 : 0,
            'isSpectator' => (int)$isUserSpectator,
            'haveBoatsBeenSet' => $haveBoatsBeenSet,
            'boatSizes' => $boatSizes,
            'nrShips' => $nrShips,
            'nrShots' => $nrShots,
            'user1Username' => $user1Username,
            'user2Username' => $user2Username,
            'status' => $status,
            'placedBoats' => $battleState[$board]['boats'],
            'hitsTaken' => $battleState[$board]['hitsTaken'],
            'hitsSent' => $battleState[$otherBoard]['hitsTaken'],
        ]) : $this->redirectToRoute('app_home');


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
        } catch (Exception $exception) {
            return new JsonResponse(['exception' => $exception]);
        }

        $battleId = $entityManager->getRepository(Battle::class)->findOneBy([
            'user1_id' => $this->getUser(),
            'password' => $battle->getPassword(),
        ])->getId();

        return new JsonResponse(['status' => true, 'battle_id' => $battleId, 'password' => $battle->getPassword()]);

    }

    #[Route('/battle/join', name: 'join_battle', methods: ['post'])]
    public function joinBattle(Pusher $pusher, Request $request, EntityManagerInterface $entityManager, JoinBattleService $service): Response
    {
        $givenPassword = $request->request->get('password');
        $battle = $entityManager->getRepository(Battle::class)->findOneBy(['password' => $givenPassword]);

        if ($battle === null) {
            return new JsonResponse(['status' => false, 'message' => 'Battle KEY Invalid!']);
        }

        if ($service->isLoggedUserSameAsGiven($battle->getUser1())) {
            return new JsonResponse(['status' => false, 'message' => 'Cannot join your own Battle!']);
        }

        if ($battle->getUser2() === null) {
            if ($givenPassword === $battle->getPassword()) { ////USELESS, WE ALREADY SEARCH BY PASSWORD

                $battle->setUser2($this->getUser());

                $entityManager->persist($battle);
                $entityManager->flush();

                $pusher->trigger(strval($battle->getId()), 'join', ['user1Username' => $battle->getUser1()->getUsername(), 'user2Username' => $battle->getUser2()->getUsername()]);

                return new JsonResponse([
                    'status' => true,
                    'battle_id' => $battle->getId(),
                ]);
            }
        } else if ($service->isLoggedUserSameAsGiven($battle->getUser2())) {
            return new JsonResponse([
                'status' => true,
                'battle_id' => $battle->getId(),
            ]);
        } else {
            return new JsonResponse(['status' => null, 'title' => 'Battle already full!', 'question' => 'Do you wish to join as spectator?', 'battle_id' => $battle->getId()]);
        }
        return new JsonResponse(['status' => false, 'message' => 'Something went wrong. Try Again!']);
    }

    #[Route('/battle/load', name: 'load_battle', methods: ['post'])]
    public function load(Request $request, EntityManagerInterface $entityManager, JoinBattleService $service): Response
    {
        $requestParameters = $request->request;

        $battle = $entityManager->getRepository(Battle::class)->findOneBy([
            "id" => $request->request->get('battle_id'),
        ]);

        $battleState = $battle->getBattleState();
        $battleState = json_decode($battleState);

        $board = $this->getUser()->getId() === $battle->getUser1()->getId() ? 'hostBoard' : 'guestBoard';

        if (!isset($battleState->{$board}->boats->{1})) {

            foreach ($requestParameters as $key => $value) {
                $params = explode(',', $value);
                if (sizeof($params) > 1) {
                    $boatNr = substr($key, -1);
                    $battleState->{$board}->boats->{$boatNr} = new stdClass();
                    $battleState->{$board}->boats->{$boatNr}->coordinates = new stdClass();
                    $battleState->{$board}->boats->{$boatNr}->health = $params[1];
                    $battleState->{$board}->boats->{$boatNr}->size = $params[1];
                    $battleState->{$board}->boats->{$boatNr}->vertical = filter_var($params[2], FILTER_VALIDATE_BOOLEAN);
                    $battleState->{$board}->boats->{$boatNr}->coordinates->posX = str_split($params[0])[1];
                    $battleState->{$board}->boats->{$boatNr}->coordinates->posY = str_split($params[0])[0];
                }
            }

            $battleState = json_encode($battleState);
            $battle->setBattleState($battleState);
            $entityManager->persist($battle);
            $entityManager->flush();

            return new JsonResponse(['status' => true]);
        }
        return new JsonResponse(['status' => false]);
    }

    #[Route('/battle/hit', name: 'hit', methods: ['post'])]
    public function hit(Pusher $pusher, Request $request, EntityManagerInterface $entityManager): Response
    {
        $coordinates = explode(" ", $request->request->get('hit'));

        $battle = $entityManager->getRepository(Battle::class)->findOneBy([
            "id" => $request->request->get('battle_id'),
        ]);

        $battleState = json_decode($battle->getBattleState());

        $board = $this->getUser()->getId() === $battle->getUser1()->getId() ? 'guestBoard' : 'hostBoard';

        $nrOfHits = count(get_object_vars($battleState->{$board}->hitsTaken)) + 1;

        $battleState->{$board}->hitsTaken->{$nrOfHits} = new stdClass();
        $battleState->{$board}->hitsTaken->{$nrOfHits}->posX = $coordinates[1];
        $battleState->{$board}->hitsTaken->{$nrOfHits}->posY = $coordinates[0];

        $isHit = false;
        $allBoatsAreDestroyed = true;

        foreach ($battleState->{$board}->boats as $boat) {
            if ($coordinates[1] === $boat->coordinates->posX && $boat->vertical === true) {
                for ($posY = intval($boat->coordinates->posY); $posY < $boat->coordinates->posY + $boat->size; $posY++) {
                    if (intval($coordinates[0]) === $posY) {
                        $isHit = true;

                        $boat->health = intval($boat->health) - 1;
                        //break;
                    }
                }
            }

            if ($coordinates[0] === $boat->coordinates->posY && $boat->vertical === false) {
                for ($posX = intval($boat->coordinates->posX); $posX < $boat->coordinates->posX + $boat->size; $posX++) {
                    if (intval($coordinates[1]) === $posX) {
                        $isHit = true;

                        $boat->health = intval($boat->health) - 1;
                        //break;
                    }
                }
            }

            if (intval($boat->health) > 0) {
                $allBoatsAreDestroyed = false;
            }
        }

        $battleState->{$board}->hitsTaken->{$nrOfHits}->isHit = $isHit;

        $battleState = json_encode($battleState);
        $battle->setBattleState($battleState);
        $entityManager->persist($battle);
        $entityManager->flush();

        $pusher->trigger($request->request->get('channel'), 'new-greeting', ['board' => $board, 'coordinates' => $coordinates, 'isHit' => $isHit]);
        return new JsonResponse(['status' => true, 'isHit' => $isHit, 'allBoatsAreDestroyed' => $allBoatsAreDestroyed]);
    }

    #[Route('/battle/end', name: 'end', methods: ['post'])]
    public function end(Pusher $pusher, Request $request, EntityManagerInterface $entityManager): Response
    {
        $battle = $entityManager->getRepository(Battle::class)->findOneBy([
            "id" => $request->request->get('battle_id'),
        ]);

        $battle->setWinner($this->getUser());
        $entityManager->persist($battle);
        $entityManager->flush();

        $pusher->trigger($request->request->get('channel'), 'declare_loser', ['isHostWinner' => $battle->getUser1()->getId() === $this->getUser()->getId()]);
        return new JsonResponse(['status' => true]);
    }
}