import React, { useEffect, useState } from "react";
import { StatusBar, StyleSheet } from 'react-native';

import { useNavigation } from "@react-navigation/native";
import { RectButton, PanGestureHandler } from "react-native-gesture-handler";
import { RFValue } from 'react-native-responsive-fontsize';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { CarDTO } from '../../dtos/CarDTO';
import { useTheme } from 'styled-components';
import { useNetInfo } from '@react-native-community/netinfo';
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../../database';
import { Car as ModelCar } from '../../database/model/Car';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedGestureHandler,
    withSpring
} from "react-native-reanimated"; 

const ButtonAnimated = Animated.createAnimatedComponent(RectButton);

import Logo from '../../assets/logo.svg';
import { Car } from "../../components/Car";
import { Load } from "../../components/Load";

import { 
    Container, 
    Header,
    HeaderContent,
    TotalCars,
    CarList
} from './styles';

export function Home() {
    const navigation = useNavigation();
    const netInfo = useNetInfo();
    const theme = useTheme();

    const positionY = useSharedValue(0);
    const positionX = useSharedValue(0);

    const myCarsButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: positionX.value},
                {translateY: positionY.value}
            ]
        }
    });

    const onGestureEvent = useAnimatedGestureHandler({
        onStart(_, ctx: any) {
            ctx.positionX = positionX.value
            ctx.positionY = positionY.value
        },
        onActive(event, ctx: any) {
            positionX.value = ctx.positionX + event.translationX;
            positionY.value = ctx.positionY + event.translationY;
        },
        onEnd() {
            positionX.value = withSpring(0)
            positionY.value = withSpring(0)
        }
    });

    const [cars, setCars] = useState<ModelCar[]>([]);
    const [loading, setLoading] = useState(true);

    function handleCarDetails(car: CarDTO) {
        navigation.navigate('CarDetails', { car });
    }

    function handleOpenMyCars() {
        navigation.navigate('MyCars');
    }

    async function offlineSynchronize() {
        await synchronize({
            database,
            pullChanges: async ({ lastPulledAt }) => {
                const { data } = await api.get(`cars/sync/pull?lastPulledVersion=${lastPulledAt || 0}`)
                
                const { changes, latestVersion } = data;
                
                return { changes, timestamp: latestVersion }
            },
            pushChanges: async ({ changes }) => {
                const user =changes.users;

                await api.post('/users/sync', user);
            } 
        });
    }

    useEffect(() => {
        let isMounted = true;

        async function fetchCars() {
            try {   
                const carsColletion = database.get<ModelCar>('cars');

                const cars = await carsColletion.query().fetch();

                if(isMounted) {
                    setCars(cars);
                } 
            } catch (error) {
                console.log(error);
            }finally {
                if(isMounted){
                    setLoading(false);
                }
            }
        }

        fetchCars();
        
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if(netInfo.isConnected) {
            offlineSynchronize();
        }
    },[netInfo.isConnected]);

    return(
        <Container>
            <StatusBar 
                barStyle="light-content"
                backgroundColor='transparent'
                translucent
            />

            <Header>
                <HeaderContent>
                    <Logo 
                        width={RFValue(108)} 
                        height={RFValue(12)} 
                    />
                    {
                        !loading &&
                        <TotalCars>
                            Total de {cars.length} carros
                        </TotalCars>
                    }
                </HeaderContent>
            </Header>

            {loading ? <Load /> :
                <CarList 
                    data={cars}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) =>  <Car data={item} onPress={() => handleCarDetails(item)}/>}
                />
            }

            <PanGestureHandler onGestureEvent={onGestureEvent}>
                <Animated.View
                    style={[
                        myCarsButtonStyle,
                        {
                            position: 'absolute',
                            bottom: 13,
                            right: 22
                        },
                    ]}
                >
                    <ButtonAnimated 
                        style={[styles.button, { backgroundColor: theme.colors.main }]} 
                        onPress={handleOpenMyCars}
                    >
                        <Ionicons  
                            name="ios-car-sport"
                            size={32}
                            color={theme.colors.shape}
                        />
                    </ButtonAnimated>
                </Animated.View>
            </PanGestureHandler>
        </Container>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center'
    }
})