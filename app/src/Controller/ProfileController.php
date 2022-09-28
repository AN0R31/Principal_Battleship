<?php

namespace App\Controller;

use App\Entity\Battle;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ProfileController extends AbstractController
{
    #[Route('/profile', name: 'profile')]
    public function index(EntityManagerInterface $entityManager): Response
    {
        $thisUser = $this->getUser();

        if (!$thisUser) {
            return $this->redirectToRoute('app_login');
        }

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

        array_splice($lastMatches, 7, sizeof($lastMatches));

        return $this->render('profile/profile.html.twig', ['lastMatches' => $lastMatches]);
    }
}