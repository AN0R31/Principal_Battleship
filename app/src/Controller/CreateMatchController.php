<?php

namespace App\Controller;

use App\Service\CreateMatchServiceProvider;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class CreateMatchController extends AbstractController
{
    #[Route('/createMatch', name: 'create_match')]
    public function index(CreateMatchServiceProvider $service): Response
    {
        if (!$this->getUser()) {
            return $this->redirectToRoute('app_login');
        }

        return $this->render('/createMatch/createMatch.html.twig', ['password' => $service->matchPassword()]);
    }

}