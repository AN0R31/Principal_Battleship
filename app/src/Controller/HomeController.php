<?php

namespace App\Controller;

use App\Entity\Battle;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class HomeController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function index(EntityManagerInterface $entityManager, Request $request): Response
    {
        $thisUser = $this->getUser();

        if (!$thisUser) {
            return $this->redirectToRoute('app_login');
        }

        $ongoingBattles = $entityManager->getRepository(Battle::class)->findBy(['winner_id' => null, 'public' => 1], array('id' => 'DESC'), 100);

        $lastMatches = $entityManager->getRepository(Battle::class)->findBy(['user1_id' => $thisUser->getId()]);

        $lastMatches2 = $entityManager->getRepository(Battle::class)->findBy(['user2_id' => $thisUser->getId()]);

        foreach ($lastMatches2 as $match) {
            $lastMatches[] = $match;
        }

        $key = 0;
        foreach ($lastMatches as $lastMatch) {
            $winner = $lastMatch->getWinner();

            if ($winner === null) {
                array_splice($lastMatches, $key, 1);
                $key--;
            }
            $key++;
        }

        $id = array();
        foreach ($lastMatches as $key => $lastMatch)
        {
            $id[$key] = $lastMatch->getId();
        }
        array_multisort($id, SORT_DESC, $lastMatches);

        array_splice($lastMatches, 5, sizeof($lastMatches));

        $key = 0;
        $matchesMissingAPlayer = [];
        foreach ($ongoingBattles as $ongoingBattle) {
            $user2 = $ongoingBattle->getUser2();
            $user1 = $ongoingBattle->getUser1();

            if($user2 === null && $user1 !== $thisUser){
                $matchesMissingAPlayer[] = $ongoingBattles[$key];
            }

            if ($user2 === null || $user2 === $thisUser || $user1 === $thisUser) {
                array_splice($ongoingBattles, $key, 1);
                $key--;
            }
            $key++;
        }

        $leaderboards = $entityManager->getRepository(User::class)->findBy([], array('points' => 'DESC'), 10);

        $userBadges = json_decode($thisUser->getBadges());

        if ($leaderboards[0] === $thisUser) {
            if (!array_search(15, $userBadges)) {
                $userBadges[] = 15;
            }
        }

        $userBadges = json_encode($userBadges);
        $thisUser->setBadges($userBadges);
        $entityManager->persist($thisUser);
        $entityManager->flush();

        $userOngoingBattle1 = $entityManager->getRepository(Battle::class)->findOneBy(['user1_id' => $thisUser->getId(), 'winner_id' => null]);
        $userOngoingBattle2 = $entityManager->getRepository(Battle::class)->findOneBy(['user2_id' => $thisUser->getId(), 'winner_id' => null]);

        if ($userOngoingBattle1 === null) {
            if ($userOngoingBattle2 === null) {
                $userOngoingBattle = null;
            } else {
                $userOngoingBattle = $userOngoingBattle2;
            }
        } else {
            $userOngoingBattle = $userOngoingBattle1;
        }

        return $this->render('home/home.html.twig', ['ongoingBattles' => $ongoingBattles, 'leaderboards' => $leaderboards, 'lastMatches' => $lastMatches, 'matchesMissingAPlayer' => $matchesMissingAPlayer, 'userOngoingBattle' => $userOngoingBattle, 'error' => $request->query->get('error')]);
    }
}