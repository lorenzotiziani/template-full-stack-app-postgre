import { Router } from 'express';
import { UserController } from './user.controller';
import { authMiddleware, requireAdmin } from '../../middleware/auth.middleware';
import {changePasswordRequirements} from "./user.dto";
import {validate} from "../../middleware/validate.middleware";

const router = Router();

// Autenticazione richiesta per tutte le route sottostanti
router.use(authMiddleware);

router.get('/profile', UserController.getProfile);
router.put('/change-password', validate(changePasswordRequirements), UserController.changePassword);
router.delete('/deleteAccount', UserController.deleteAccount);
router.get('/', requireAdmin, UserController.getAllUsers);



export default router;