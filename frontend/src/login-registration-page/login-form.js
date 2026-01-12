import {useEffect, useState} from "react";
import apiClient from '../configurations/configAxios';
import {useLocation, useNavigate} from "react-router-dom";
import {useDispatch} from "react-redux";
import {set_token} from "../storeConfig/auth_reducer";
import toast, { Toaster } from 'react-hot-toast';
import {
    Button,
    Input,
    VStack,
    Link,
    Box,
    Text,
    HStack,
    Icon,
    IconButton
} from "@chakra-ui/react";
import Notification from "../components/notification";
import SecretField from "../components/secret-field";
import TurnstileWidget from "../components/TurnstileWidget";
import { BsExclamationCircle } from "react-icons/bs";
import { LuUser, LuLock, LuEye, LuEyeOff } from "react-icons/lu";

export function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(false);
    const [secretField, setSecretField] = useState("");
    const [turnstileToken, setTurnstileToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const location = useLocation();
    const from = location.state?.from;

    const [showPasswordNotification, setShowPasswordNotification] = useState(from === "/password/reset");

    const submit = async e => {

        e.preventDefault()

        // If the hidden honeypot field is filled, it's likely a bot. Return early.
        if (secretField) return;

        if (process.env.REACT_APP_TURNSTILE_SITE_KEY && !turnstileToken) {
            toast.error("Please verify you are human");
            return;
        }

        setIsLoading(true);

        const userCredentials = {
            username: username,
            password: password,
            turnstile_token: turnstileToken
        }

        try {

            // Send credentials to retrieve access and refresh tokens
            const response = await apiClient.post('/token/', userCredentials, {
                withCredentials: true
            });

            const {data} = response;


            const new_state = {
                access_token: data.access,
                refresh_token: data.refresh,
                username: username
            }

            dispatch(set_token(new_state));
            setLoginError(false);
            navigate("/dashboard", { replace: true, state: { from: location.pathname } });
            window.location.reload();
        } catch (err) {
            setLoginError(true);
        } finally {
            setIsLoading(false);
        }

    }

    useEffect(() => {
        if (showPasswordNotification) {
            toast.custom((t) => (
                <Notification title={"Password Reset"} message={"Your password has been changed"} toast_object={t}/>
            ), {
                duration: 15000,
            }
            );
            setShowPasswordNotification(false);
        }
    }, [showPasswordNotification]);

    return (

        <>

            <Toaster
                position="top-center"
                reverseOrder={false}
            />

            <Box width="full">
                <form onSubmit={submit}>
                    <VStack spacing={5}>
                        {loginError && (
                            <Box bg="red.50" _dark={{ bg: "red.900" }} p={3} borderRadius="md" color="red.800" _dark={{ color: "red.100" }} width="full">
                                <HStack spacing={2}>
                                    <Icon as={BsExclamationCircle} />
                                    <Text fontSize="sm">Incorrect Username or Password</Text>
                                </HStack>
                            </Box>
                        )}

                        <Box width="full">
                            <Text fontSize="sm" fontWeight="medium" mb={1}>Username</Text>
                            <Box position="relative">
                                <Box
                                    position="absolute"
                                    left="3"
                                    top="0"
                                    bottom="0"
                                    display="flex"
                                    alignItems="center"
                                    pointerEvents="none"
                                    zIndex={2}
                                >
                                    <Icon as={LuUser} color="gray.400" fontSize="lg" />
                                </Box>
                                <Input
                                    variant="outline"
                                    bg={{ base: "gray.50", _dark: "whiteAlpha.50" }}
                                    borderColor="gray.200"
                                    _focus={{ borderColor: "blue.500", bg: "white", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                                    _hover={{ borderColor: "gray.300" }}
                                    placeholder="Enter Username"
                                    name='username'
                                    type='text'
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    borderRadius="lg"
                                    fontSize="md"
                                    size="lg"
                                    pl={10}
                                />
                            </Box>
                        </Box>

                        <Box width="full">
                            <Text fontSize="sm" fontWeight="medium" mb={1}>Password</Text>
                            <Box position="relative">
                                <Box
                                    position="absolute"
                                    left="3"
                                    top="0"
                                    bottom="0"
                                    display="flex"
                                    alignItems="center"
                                    pointerEvents="none"
                                    zIndex={2}
                                >
                                    <Icon as={LuLock} color="gray.400" fontSize="lg" />
                                </Box>
                                <Input
                                    placeholder="Enter password"
                                    variant="outline"
                                    bg={{ base: "gray.50", _dark: "whiteAlpha.50" }}
                                    borderColor="gray.200"
                                    _focus={{ borderColor: "blue.500", bg: "white", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                                    _hover={{ borderColor: "gray.300" }}
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    borderRadius="lg"
                                    fontSize="md"
                                    size="lg"
                                    pl={10}
                                    pr={10}
                                />
                                <Box
                                    position="absolute"
                                    right="1"
                                    top="0"
                                    bottom="0"
                                    display="flex"
                                    alignItems="center"
                                    zIndex={2}
                                >
                                    <IconButton
                                        variant="ghost"
                                        icon={showPassword ? <LuEyeOff /> : <LuEye />}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        size="sm"
                                        color="gray.400"
                                        _hover={{ color: "gray.600", bg: "transparent" }}
                                    />
                                </Box>
                            </Box>
                            <Box textAlign="right" mt={2}>
                                <Link
                                    fontSize="sm"
                                    color={{ base: "blue.600", _dark: "blue.400" }}
                                    fontWeight="medium"
                                    onClick={() => navigate("/password/forgot")}
                                >
                                    Forgot password?
                                </Link>
                            </Box>
                        </Box>

                        <SecretField value={secretField} setter={setSecretField} />
                        <TurnstileWidget setToken={setTurnstileToken} />

                        <Button
                            type="submit"
                            colorScheme="blue"
                            size="lg"
                            width="full"
                            isLoading={isLoading}
                            loadingText="Signing In..."
                            fontSize="md"
                            fontWeight="bold"
                            borderRadius="lg"
                            boxShadow="md"
                            _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
                            transition="all 0.2s"
                        >
                            Sign In
                        </Button>
                    </VStack>
                </form>
            </Box>



        </>


    )

}