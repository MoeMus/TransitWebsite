import { Login } from "./login-form";
import { useNavigate } from 'react-router-dom';
import React from "react";
import {
    Box,
    Flex,
    Heading,
    Text,
    Link,
    VStack,
    Stack,
    Icon,
    HStack,
    Badge,
} from "@chakra-ui/react";
import { LuExternalLink } from "react-icons/lu";
import { FaGithub } from "react-icons/fa";
import { BsGeoAlt, BsPinMap, BsPersonWalking, BsBusFront } from "react-icons/bs";

export function RegistrationPage() {
    const navigate = useNavigate();

    return (
        <Flex minH="100vh" direction={{ base: "column", md: "row" }}>
            {/* 
                Using a new form style so override the default style for now
            */}
            <style>
                {`
                    .Auth-form-container {
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                    }
                    .Auth-form {
                        width: 100% !important;
                    }
                    .Auth-form-content {
                        margin-bottom: 0 !important;
                    }
                    /* Hide the internal heading of the Login component to avoid duplicates */
                    .Auth-form-content h2 {
                        display: none !important;
                    }
                `}
            </style>

            {/* Left Pane */}
            <Flex
                flex={{ base: 1, md: "0 0 50%", lg: "0 0 50%" }}
                bg="gray.900"
                position="relative"
                overflow="hidden"
                justify="center"
                align="center"
                p={{ base: 8, md: 16 }}
            >
                {/* Background */}
                <Box
                    position="absolute"
                    top="-20%"
                    left="-20%"
                    w="80%"
                    h="80%"
                    bgGradient="radial(blue.800, transparent)"
                    filter="blur(120px)"
                    opacity={0.6}
                />
                <Box
                    position="absolute"
                    bottom="-20%"
                    right="-20%"
                    w="80%"
                    h="80%"
                    bgGradient="radial(teal.800, transparent)"
                    filter="blur(100px)"
                    opacity={0.5}
                />

                <VStack spacing={12} align="center" zIndex={1} w="full" maxW="lg">
                    
                    {/* Header Text */}
                    <VStack spacing={4} textAlign="center">
                        <Text color="white" fontWeight="bold" fontSize="2xl" letterSpacing="tight">TransitTail</Text>
                        <Heading
                            as="h1"
                            fontSize={{ base: "4xl", md: "5xl" }}
                            fontWeight="bold"
                            letterSpacing="-0.02em"
                            lineHeight="1.1"
                            color="white"
                        >
                            Master your commute.
                        </Heading>
                        <Text fontSize="lg" color="gray.400" maxW="md">
                            Real-time transit data synced with your SFU schedule. Never miss a lecture again.
                        </Text>
                    </VStack>

                    {/*TransitWebsite */}
                    <Box
                        w="full"
                        maxW="360px"
                        bg="whiteAlpha.900"
                        backdropFilter="blur(12px)"
                        borderRadius="2xl"
                        boxShadow="2xl"
                        position="relative"
                        transform={{ base: "none", md: "perspective(1000px) rotateY(-12deg) rotateX(5deg)" }}
                        transition="all 0.5s ease"
                        _hover={{ transform: "perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02)" }}
                        overflow="hidden"
                    >
                        <Box p={6} position="relative">
                            {/* Vertical Line */}
                            <Box
                                position="absolute"
                                left="46px"
                                top="48px"
                                bottom="48px"
                                width="4px"
                                borderRadius="full"
                                backgroundImage="linear-gradient(to bottom, #198754 0%, #0d6efd 50%, #dc3545 100%)"
                                opacity={0.3}
                            />

                            {/* Start Node */}
                            <Flex mb={6} align="center" position="relative" zIndex={1}>
                                <Flex
                                    boxSize="12"
                                    bg="green.500"
                                    borderRadius="full"
                                    align="center"
                                    justify="center"
                                    color="white"
                                    border="4px solid white"
                                    boxShadow="md"
                                    animation="pulse-green 2s infinite"
                                    flexShrink={0}
                                >
                                    <Icon as={BsGeoAlt} boxSize={5} />
                                </Flex>
                                <Box ml={4}>
                                    <Text fontWeight="bold" color="gray.800" fontSize="md">Start Journey</Text>
                                    <Text fontSize="sm" color="gray.500" fontWeight="medium">7:50 AM</Text>
                                </Box>
                            </Flex>

                            {/* Step 1: Walk */}
                            <Flex mb={6} align="start" position="relative" zIndex={1}>
                                <Flex
                                    boxSize="12"
                                    bg="white"
                                    borderRadius="full"
                                    align="center"
                                    justify="center"
                                    color="blue.500"
                                    border="4px solid"
                                    borderColor="gray.50"
                                    boxShadow="sm"
                                    flexShrink={0}
                                >
                                    <Icon as={BsPersonWalking} boxSize={5} />
                                </Flex>
                                <Box ml={4} p={3} bg="gray.50" borderRadius="lg" w="full" boxShadow="sm" border="1px solid" borderColor="gray.100">
                                    <Text fontWeight="medium" color="gray.800" fontSize="sm">Walk to Stop</Text>
                                    <HStack mt={2}>
                                        <Badge bg="white" color="gray.600" boxShadow="sm" px={2} py={0.5} borderRadius="md">5 min</Badge>
                                    </HStack>
                                </Box>
                            </Flex>

                            {/* Step 2: Bus */}
                            <Flex mb={6} align="start" position="relative" zIndex={1}>
                                <Flex
                                    boxSize="12"
                                    bg="white"
                                    borderRadius="full"
                                    align="center"
                                    justify="center"
                                    color="blue.500"
                                    border="4px solid"
                                    borderColor="gray.50"
                                    boxShadow="sm"
                                    flexShrink={0}
                                >
                                    <Icon as={BsBusFront} boxSize={5} />
                                </Flex>
                                <Box ml={4} p={3} bg="gray.50" borderRadius="lg" w="full" boxShadow="sm" border="1px solid" borderColor="gray.100">
                                    <Text fontWeight="medium" color="gray.800" fontSize="sm">145 Production Stn</Text>
                                    <Box mt={2} p={2} bg="white" borderRadius="md" border="1px solid" borderColor="gray.100">
                                        <HStack mb={1}>
                                            <Badge colorScheme="blue" variant="solid">145</Badge>
                                            <Text fontSize="xs" color="gray.500">Towards SFU</Text>
                                        </HStack>
                                        <HStack justify="space-between">
                                            <Text fontSize="xs" fontWeight="bold" color="gray.700">8:00 AM</Text>
                                            <Text fontSize="xs" color="gray.400">15 min</Text>
                                        </HStack>
                                    </Box>
                                </Box>
                            </Flex>

                            {/* End Node */}
                            <Flex align="center" position="relative" zIndex={1}>
                                <Flex
                                    boxSize="12"
                                    bg="red.500"
                                    borderRadius="full"
                                    align="center"
                                    justify="center"
                                    color="white"
                                    border="4px solid white"
                                    boxShadow="md"
                                    flexShrink={0}
                                >
                                    <Icon as={BsPinMap} boxSize={5} />
                                </Flex>
                                <Box ml={4}>
                                    <Text fontWeight="bold" color="gray.800" fontSize="md">Arrive at SFU</Text>
                                    <Text fontSize="sm" color="gray.500" fontWeight="medium">8:20 AM</Text>
                                </Box>
                            </Flex>
                        </Box>
                    </Box>

                </VStack>
            </Flex>

            {/* Right Pane */}
            <Flex
                flex={{ base: 1, md: "0 0 50%", lg: "0 0 50%" }}
                bg={{ base: "white", _dark: "gray.900" }}
                justify="center"
                align="center"
                p={{ base: 6, md: 12 }}
            >
                <Box w="full" maxW="sm">
                    <VStack spacing={6} align="stretch">
                        <Box>
                            <Heading size="lg" fontWeight="bold" letterSpacing="-0.02em" color={{ base: "gray.900", _dark: "white" }}>
                                Welcome back
                            </Heading>
                            <Text color="gray.500" mt={2} fontSize="md">
                                Please enter your details to sign in.
                            </Text>
                        </Box>

                        {/* Login Form, styles are overridden by CSS above */}
                        <Login />

                        <Stack pt={4} spacing={4} align="center">
                            <Text fontSize="sm" color="gray.500">
                                Don't have an account?{" "}
                                <Link
                                    color="blue.600"
                                    fontWeight="semibold"
                                    onClick={() => navigate("/signup")}
                                    _hover={{ textDecoration: 'none', color: 'blue.700' }}
                                >
                                    Sign up for free
                                </Link>
                            </Text>

                            <Link
                                href="https://github.com/MoeMus/TransitWebsite"
                                isExternal
                                fontSize="xs"
                                color="gray.400"
                                display="flex"
                                alignItems="center"
                                gap={2}
                                _hover={{ color: "gray.600" }}
                            >
                                <Icon as={FaGithub} /> View on GitHub <Icon as={LuExternalLink} />
                            </Link>
                        </Stack>
                    </VStack>
                </Box>
            </Flex>
        </Flex>
    );
}