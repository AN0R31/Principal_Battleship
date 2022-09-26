<?php

namespace App\Controller;

use App\Entity\Battle;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class HomeController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function index(EntityManagerInterface $entityManager): Response
    {
        $thisUser = $this->getUser();

        if (!$thisUser) {
            return $this->redirectToRoute('app_login');
        }

        $ongoingBattles = $entityManager->getRepository(Battle::class)->findBy(['winner_id' => null, 'public' => 1], array('id' => 'DESC'), 100);

        $lastMatches = $entityManager->getRepository(Battle::class)->findBy(['user1_id' => $thisUser], array('id' => 'DESC'));

        $lastMatches += $entityManager->getRepository(Battle::class)->findBy(['user2_id' => $thisUser], array('id' => 'DESC'));

        $key = 0;
        foreach ($lastMatches as $lastMatch) {
            $winner = $lastMatch->getWinner();

            if ($winner === null) {
                array_splice($lastMatches, $key, 1);
                $key--;
            }
            $key++;
        }

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

        return $this->render('home/home.html.twig', ['ongoingBattles' => $ongoingBattles, 'leaderboards' => $leaderboards, 'lastMatches' => $lastMatches, 'matchesMissingAPlayer' => $matchesMissingAPlayer]);
    }
}