<?php

namespace App\Controller;

use App\Entity\Battle;
use App\Service\CreateMatchServiceProvider;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class BattleController extends AbstractController
{
    #[Route('/battle', name: 'create_matchPOST', methods: ['post'])]
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

        return new JsonResponse(true);

    }

}