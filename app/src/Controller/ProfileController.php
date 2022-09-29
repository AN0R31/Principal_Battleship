<?php

namespace App\Controller;

use App\Entity\Badge;
use App\Entity\Battle;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use function GuzzleHttp\Promise\all;

class ProfileController extends AbstractController
{
    #[Route('/profile', name: 'profile')]
    public function index(EntityManagerInterface $entityManager, Request $request): Response
    {
        if (!$this->getUser()) {
            return $this->redirectToRoute('app_login');
        }

        if ($request->get('id') === null) {
            $user = $this->getUser();
        } else {
            $user = $entityManager->getRepository(User::class)->findOneBy(['id' => $request->get('id')]);
            if (!$user) {
                dd('User not found!');
            }
        }

        $lastMatches = $entityManager->getRepository(Battle::class)->findBy(['user1_id' => $user->getId()]);

        $lastMatches2 = $entityManager->getRepository(Battle::class)->findBy(['user2_id' => $user->getId()]);

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

        $allBadges = $entityManager->getRepository(Badge::class)->findAll();

        $userBadges = json_decode($user->getBadges());

        if ($user->getMatches() >= 10) {
            if (!array_search(4, $userBadges)) {
                $userBadges[] = 4;
            } elseif ($user->getMatches() >= 50) {
                if (!array_search(7, $userBadges)) {
                    $userBadges[] = 7;
                } elseif ($user->getMatches() >= 250) {
                    if (!array_search(10, $userBadges)) {
                        $userBadges[] = 10;
                    } elseif ($user->getMatches() >= 1000) {
                        if (!array_search(13, $userBadges)) {
                            $userBadges[] = 13;
                        }
                    }
                }
            }
        }

        if ($user->getPoints() >= 100) {
            if (!array_search(3, $userBadges)) {
                $userBadges[] = 3;
            } elseif ($user->getPoints() >= 500) {
                if (!array_search(6, $userBadges)) {
                    $userBadges[] = 6;
                } elseif ($user->getPoints() >= 2500) {
                    if (!array_search(9, $userBadges)) {
                        $userBadges[] = 9;
                    } elseif ($user->getPoints() >= 10000) {
                        if (!array_search(12, $userBadges)) {
                            $userBadges[] = 12;
                        }
                    }
                }
            }
        }

        if ($user->getRegistrationDate() <= strtotime('-1 month')) {
            if (!array_search(5, $userBadges)) {
                $userBadges[] = 5;
            } elseif ($user->getRegistrationDate() <= strtotime('-6 months')) {
                if (!array_search(8, $userBadges)) {
                    $userBadges[] = 8;
                } elseif ($user->getRegistrationDate() <= strtotime('-1 year')) {
                    if (!array_search(11, $userBadges)) {
                        $userBadges[] = 11;
                    } elseif ($user->getRegistrationDate() <= strtotime('-5 years')) {
                        if (!array_search(14, $userBadges)) {
                            $userBadges[] = 14;
                        }
                    }
                }
            }
        }

        if ($entityManager->getRepository(Battle::class)->findOneBy(['user1_id' => $user->getId(), 'public' => 1]) !== null || $entityManager->getRepository(Battle::class)->findOneBy(['user2_id' => $user->getId(), 'public' => 1]) !== null) {
            if (!array_search(2, $userBadges)) {
                $userBadges[] = 2;
            }
        }

        $rarity = array();
        foreach ($userBadges as $key => $userBadge)
        {
            $badges[] = $allBadges[$userBadge-1];
            $rarity[$key] = $allBadges[$userBadge-1]->getRarity();
        }
        array_multisort($rarity, SORT_ASC, $badges);

        if (sizeof($userBadges) > 6) {
            array_splice($badges, 6, sizeof($userBadges));
        }

        $userBadges = json_encode($userBadges);
        $user->setBadges($userBadges);
        $entityManager->persist($user);
        $entityManager->flush();

        $allUsersSortedByPoints = $entityManager->getRepository(User::class)->findBy(array(), array('points' => 'DESC'));

        $position = null;
        foreach ($allUsersSortedByPoints as $key=>$userSortedByPoint) {
            if ($userSortedByPoint->getId() === $user->getId()) {
                $position = $key;
            }
        }

        $numberOfUsers = sizeof($allUsersSortedByPoints);

        if ($position < $numberOfUsers/4*3) {
            if ($position < $numberOfUsers/2) {
                if ($position < $numberOfUsers/4) {
                    $rank = 1;
                } else {
                    $rank = 2;
                }
            } else {
                $rank = 3;
            }
        } else {
            $rank = 4;
        }

        return $this->render('profile/profile.html.twig', ['lastMatches' => $lastMatches, 'user' => $user, 'badges' => $badges, 'rank' => $rank]);
    }

    #[Route('/profile/setProfilePicture', name: 'setProfilePicture')]
    public function setProfilePicture(EntityManagerInterface $entityManager, Request $request): Response
    {
        if (!$this->getUser()) {
            return $this->redirectToRoute('app_login');
        }

        $user = $this->getUser();

        $user->setProfilePicture($request->request->get('picture_tag'));

        $entityManager->persist($user);
        $entityManager->flush();

        return new JsonResponse(['status' => true]);
    }
}