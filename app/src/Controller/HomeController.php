<?php

namespace App\Controller;

use App\Entity\Battle;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class HomeController extends AbstractController
{
    #[Route('/', name: 'app_home')]
    public function index(EntityManagerInterface $entityManager): Response
    {
        if (!$this->getUser()) {
            return $this->redirectToRoute('app_login');
        }

        $ongoingBattles = $entityManager->getRepository(Battle::class)->findBy(['winner_id' => null], array('id' => 'DESC'), 100);

        $key = 0;
        foreach ($ongoingBattles as $ongoingBattle) {
            if ($ongoingBattle->getUser2() === null) {
                array_splice($ongoingBattles, $key, 1);
                $key--;
            }
            $key++;
        }

        array_splice($ongoingBattles, 4, sizeof($ongoingBattles));

        return $this->render('home/home.html.twig', ['ongoingBattles' => $ongoingBattles]);
    }
}