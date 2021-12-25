import React, { FormEvent, useState } from 'react';
import { Modal } from 'react-bootstrap';
//import { StaticContext } from 'react-router';
import { Redirect, RouteComponentProps, RouterProps, useLocation } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Button, Card, CardBody} from 'reactstrap';
import { useAuth } from './AuthProvider';

type LocationState = {
    from: Location;
};
interface ILoginProps extends RouterProps{
 
}
const testCreds = { username: 'chris@tyddynonn.co.uk', password: 'GeedySponzo' };
export default function Login(props: ILoginProps) {

    const auth = useAuth();
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const { state } = useLocation<LocationState>();

    const [modalOpen, setModalOpen] = useState(true);

   const handleSubmit = async (e:FormEvent) => {
       e.preventDefault();
       //auth?.signIn( { username: username, password: password });
       auth?.signIn(testCreds);
       setModalOpen(false);
    }
    //console.log(`Login.tsx show=${modalOpen} isAuth=${auth?.isAuthenticated()}`)
    return (
        auth?.isAuthenticated() ?
            (
                <Redirect to={state?.from || '/'} />
            )
            :(

            <Modal
                show={modalOpen}
                onHide={() => { setModalOpen(false) }}
                centered
                scrollable
            >
                <Modal.Header closeButton>
                    <Modal.Title>Please Log in</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    <Card>
                        <CardBody>
                                <Form onSubmit={handleSubmit}>
                                    <FormGroup>
                                        <Label>Email address</Label>
                                        <Input type="email" placeholder="Enter email" onChange={e => setUserName(e.target.value)} />
                                    </FormGroup>

                                    <FormGroup>
                                        <Label>Password</Label>
                                        <Input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
                                    </FormGroup>
                                    <Button variant="primary" type="submit">
                                        Log In
                                    </Button>
                                </Form>

                        </CardBody>
                    </Card>
                </Modal.Body>
            </Modal>

                )
        )

}